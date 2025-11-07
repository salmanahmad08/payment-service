import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { ListTransactionsDto } from './dto/list-transactions.dto';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let mockTransactionModel: any;

  beforeEach(async () => {
    // Mock the Transaction model
    mockTransactionModel = {
      countDocuments: jest.fn(),
      find: jest.fn().mockReturnThis(), // Chainable methods
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getModelToken(Transaction.name),
          useValue: mockTransactionModel,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listTransactions', () => {
    it('should return paginated transactions with filters', async () => {
      const filters: ListTransactionsDto = {
        userId: 'user123',
        status: 'success',
        type: 'subscription',
        provider: 'stripe',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        page: 1,
        limit: 10,
      };

      const mockTransactions: TransactionDocument[] = [
        {
          _id: 'txn1',
          userId: 'user123',
          status: 'success',
        } as TransactionDocument,
      ];
      const total = 1;

      mockTransactionModel.countDocuments.mockResolvedValue(total);
      mockTransactionModel.exec.mockResolvedValue(mockTransactions);

      const result = await service.listTransactions(filters);

      expect(mockTransactionModel.countDocuments).toHaveBeenCalledWith({
        userId: 'user123',
        status: 'success',
        type: 'subscription',
        provider: 'stripe',
        createdAt: {
          $gte: new Date('2023-01-01'),
          $lte: new Date('2023-12-31'),
        },
      });
      expect(mockTransactionModel.find).toHaveBeenCalledWith({
        userId: 'user123',
        status: 'success',
        type: 'subscription',
        provider: 'stripe',
        createdAt: {
          $gte: new Date('2023-01-01'),
          $lte: new Date('2023-12-31'),
        },
      });
      expect(mockTransactionModel.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockTransactionModel.skip).toHaveBeenCalledWith(0);
      expect(mockTransactionModel.limit).toHaveBeenCalledWith(10);
      expect(mockTransactionModel.populate).toHaveBeenCalledWith({
        path: 'userId',
        select: '-password -__v',
      });
      expect(result).toEqual({
        total,
        page: 1,
        limit: 10,
        transactions: mockTransactions,
      });
    });

    it('should handle partial filters (e.g., only userId)', async () => {
      const filters: ListTransactionsDto = { userId: 'user123' };

      const mockTransactions: TransactionDocument[] = [];
      const total = 0;

      mockTransactionModel.countDocuments.mockResolvedValue(total);
      mockTransactionModel.exec.mockResolvedValue(mockTransactions);

      const result = await service.listTransactions(filters);

      expect(mockTransactionModel.countDocuments).toHaveBeenCalledWith({
        userId: 'user123',
      });
      expect(result).toEqual({
        total,
        page: 1,
        limit: 10,
        transactions: mockTransactions,
      });
    });

    it('should use default pagination if not provided', async () => {
      const filters: ListTransactionsDto = {}; // No page/limit

      const mockTransactions: TransactionDocument[] = [];
      const total = 0;

      mockTransactionModel.countDocuments.mockResolvedValue(total);
      mockTransactionModel.exec.mockResolvedValue(mockTransactions);

      const result = await service.listTransactions(filters);

      expect(mockTransactionModel.skip).toHaveBeenCalledWith(0); // (1-1)*10
      expect(mockTransactionModel.limit).toHaveBeenCalledWith(10);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should handle date filters correctly', async () => {
      const filters: ListTransactionsDto = {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      };

      mockTransactionModel.countDocuments.mockResolvedValue(0);
      mockTransactionModel.exec.mockResolvedValue([]);

      await service.listTransactions(filters);

      expect(mockTransactionModel.countDocuments).toHaveBeenCalledWith({
        createdAt: {
          $gte: new Date('2023-01-01'),
          $lte: new Date('2023-12-31'),
        },
      });
    });

    it('should handle no filters (empty query)', async () => {
      const filters: ListTransactionsDto = {};

      const mockTransactions: TransactionDocument[] = [
        { _id: 'txn1' } as TransactionDocument,
      ];
      const total = 1;

      mockTransactionModel.countDocuments.mockResolvedValue(total);
      mockTransactionModel.exec.mockResolvedValue(mockTransactions);

      const result = await service.listTransactions(filters);

      expect(mockTransactionModel.countDocuments).toHaveBeenCalledWith({});
      expect(result.transactions).toEqual(mockTransactions);
    });
  });
});
