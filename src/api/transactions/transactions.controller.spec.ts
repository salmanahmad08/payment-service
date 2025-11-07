import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListTransactionsDto } from './dto/list-transactions.dto';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let mockTransactionsService: any;

  beforeEach(async () => {
    mockTransactionsService = {
      listTransactions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
        {
          provide: JwtAuthGuard, // Mock the guard
          useValue: { canActivate: jest.fn(() => true) }, // Assume guard passes
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    const mockReq = { user: { id: 'user123', sub: 'user456' } }; // Test both id and sub
    const mockQuery: ListTransactionsDto = { page: 1, limit: 10 };
    const mockServiceResult = {
      total: 1,
      page: 1,
      limit: 10,
      transactions: [{ _id: 'txn1' }],
    };

    it('should list transactions with provided userId', async () => {
      const queryWithUserId = { ...mockQuery, userId: 'customUser' };
      mockTransactionsService.listTransactions.mockResolvedValue(
        mockServiceResult,
      );

      const result = await controller.list(queryWithUserId, mockReq);

      expect(mockTransactionsService.listTransactions).toHaveBeenCalledWith(
        queryWithUserId,
      );
      expect(result).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        data: [{ _id: 'txn1' }],
      });
    });

    it('should inject userId from req.user.id if not provided', async () => {
      mockTransactionsService.listTransactions.mockResolvedValue(
        mockServiceResult,
      );

      const result = await controller.list(mockQuery, mockReq);

      expect(mockTransactionsService.listTransactions).toHaveBeenCalledWith({
        ...mockQuery,
        userId: 'user123',
      });
      expect(result.data).toEqual(mockServiceResult.transactions);
    });

    it('should inject userId from req.user.sub if id is not available', async () => {
      const reqWithoutId = { user: { sub: 'user456' } };
      mockTransactionsService.listTransactions.mockResolvedValue(
        mockServiceResult,
      );

      const result = await controller.list(mockQuery, reqWithoutId);

      expect(mockTransactionsService.listTransactions).toHaveBeenCalledWith({
        ...mockQuery,
        userId: 'user456',
      });
    });

    it('should handle service errors', async () => {
      mockTransactionsService.listTransactions.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(controller.list(mockQuery, mockReq)).rejects.toThrow(
        'DB error',
      );
    });
  });
});
