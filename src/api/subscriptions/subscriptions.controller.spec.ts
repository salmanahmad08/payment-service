import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;
  let mockSubscriptionsService: any;

  beforeEach(async () => {
    mockSubscriptionsService = {
      createSubscription: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
        {
          provide: JwtAuthGuard, // Mock the guard
          useValue: { canActivate: jest.fn(() => true) }, // Assume guard passes
        },
      ],
    }).compile();

    controller = module.get<SubscriptionsController>(SubscriptionsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockReq = { user: { id: 'user123' } };
    const mockBody = { planId: 'plan456', customerId: 'cus789' };
    const idempotencyKey = 'key123';

    it('should create a subscription successfully', async () => {
      const mockResult = { subscription: {}, transaction: {} };
      mockSubscriptionsService.createSubscription.mockResolvedValue(mockResult);

      const result = await controller.create(mockReq, mockBody, idempotencyKey);

      expect(mockSubscriptionsService.createSubscription).toHaveBeenCalledWith(
        'user123',
        'plan456',
        'cus789',
        'key123',
      );
      expect(result).toEqual(mockResult);
    });

    it('should throw BadRequestException if idempotency key is missing', async () => {
      await expect(
        controller.create(mockReq, mockBody, undefined),
      ).rejects.toThrow(BadRequestException);
      expect(
        mockSubscriptionsService.createSubscription,
      ).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockSubscriptionsService.createSubscription.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(
        controller.create(mockReq, mockBody, idempotencyKey),
      ).rejects.toThrow('Service error');
    });
  });
});
