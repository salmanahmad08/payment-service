import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription } from './schemas/subscription.schema';
import {
  Transaction,
  TransactionDocument,
} from '../transactions/schemas/transaction.schema';

// Mock Stripe at the top (before imports)
jest.mock('stripe', () => ({
  default: jest.fn().mockImplementation(() => ({
    subscriptions: {
      create: jest.fn(),
    },
  })),
}));

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let mockSubscriptionModel: any;
  let mockTransactionModel: any;
  let mockStripe: any;

  beforeEach(async () => {
    // Mock models
    mockSubscriptionModel = {
      create: jest.fn(),
    };
    mockTransactionModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    // Mock Stripe instance
    mockStripe = {
      subscriptions: {
        create: jest.fn(),
      },
    };
    (require('stripe') as jest.Mock).mockReturnValue(mockStripe);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getModelToken(Subscription.name),
          useValue: mockSubscriptionModel,
        },
        {
          provide: getModelToken(Transaction.name),
          useValue: mockTransactionModel,
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);

    // Set env var for Stripe key (mock if needed)
    process.env.STRIPE_SECRET_KEY = 'test_key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSubscription', () => {
    const userId = 'user123';
    const planId = 'plan456';
    const customerId = 'cus789';
    const idempotencyKey = 'key123';

    it('should create a subscription successfully', async () => {
      // Mock Stripe response
      const mockStripeSub = {
        id: 'sub_123',
        status: 'active',
        current_period_end: 1640995200, // Unix timestamp
        cancel_at_period_end: false,
        plan: { amount: 2000 }, // Amount in cents
        currency: 'usd',
      };
      mockStripe.subscriptions.create.mockResolvedValue(mockStripeSub);

      // Mock model creations
      const mockSub = { _id: 'sub_id', ...mockStripeSub };
      const mockTxn = { _id: 'txn_id', status: 'success' };
      mockSubscriptionModel.create.mockResolvedValue(mockSub);
      mockTransactionModel.create.mockResolvedValue(mockTxn);

      const result = await service.createSubscription(
        userId,
        planId,
        customerId,
        idempotencyKey,
      );

      expect(mockTransactionModel.findOne).toHaveBeenCalledWith({
        idempotencyKey,
      });
      expect(mockStripe.subscriptions.create).toHaveBeenCalledWith({
        customer: customerId,
        items: [{ price: planId }],
      });
      expect(mockSubscriptionModel.create).toHaveBeenCalled();
      expect(mockTransactionModel.create).toHaveBeenCalled();
      expect(result).toEqual({ subscription: mockSub, transaction: mockTxn });
    });

    it('should return existing transaction if idempotency key exists', async () => {
      const existingTxn = { _id: 'existing_txn', status: 'success' };
      mockTransactionModel.findOne.mockResolvedValue(existingTxn);

      const result = await service.createSubscription(
        userId,
        planId,
        customerId,
        idempotencyKey,
      );

      expect(mockTransactionModel.findOne).toHaveBeenCalledWith({
        idempotencyKey,
      });
      expect(mockStripe.subscriptions.create).not.toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Transaction already exists for this idempotency key',
        transaction: existingTxn,
      });
    });

    it('should throw BadRequestException if idempotency key is missing', async () => {
      await expect(
        service.createSubscription(userId, planId, customerId, ''),
      ).rejects.toThrow(BadRequestException);
      expect(mockTransactionModel.findOne).not.toHaveBeenCalled();
    });

    it('should handle Stripe errors gracefully', async () => {
      const error = new Error('Stripe API error');
      mockStripe.subscriptions.create.mockRejectedValue(error);

      const result = await service.createSubscription(
        userId,
        planId,
        customerId,
        idempotencyKey,
      );

      expect(result).toEqual({ error: true, message: 'Stripe API error' });
    });

    it('should handle missing amount in Stripe response (fix for runtime error)', async () => {
      // Mock Stripe response without plan.amount
      const mockStripeSub = {
        id: 'sub_123',
        status: 'active',
        current_period_end: 1640995200,
        cancel_at_period_end: false,
        // No plan.amount
      };
      mockStripe.subscriptions.create.mockResolvedValue(mockStripeSub);

      const mockSub = { _id: 'sub_id' };
      const mockTxn = { _id: 'txn_id', status: 'success' };
      mockSubscriptionModel.create.mockResolvedValue(mockSub);
      mockTransactionModel.create.mockResolvedValue(mockTxn);

      const result = await service.createSubscription(
        userId,
        planId,
        customerId,
        idempotencyKey,
      );

      // Should default to 0 if amount is undefined
      expect(mockTransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 0 }),
      );
      expect(result).toEqual({ subscription: mockSub, transaction: mockTxn });
    });
  });
});
