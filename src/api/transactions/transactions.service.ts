import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { ListTransactionsDto } from './dto/list-transactions.dto';

interface PaginatedTransactions {
  total: number;
  page: number;
  limit: number;
  transactions: TransactionDocument[];
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  async listTransactions(
    filters: ListTransactionsDto,
  ): Promise<PaginatedTransactions> {
    const query: any = {};

    if (filters.userId) query.userId = filters.userId;
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;
    if (filters.provider) query.provider = filters.provider;

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const total = await this.transactionModel.countDocuments(query);

    const transactions = await this.transactionModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'userId',
        select: '-password -__v',
      })
      .exec();

    return { total, page, limit, transactions };
  }
}
