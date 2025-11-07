import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { ListTransactionsDto } from './dto/list-transactions.dto';

@Controller('payments/transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async list(@Query() query: ListTransactionsDto, @Req() req) {
    if (!query.userId) query.userId = req.user.sub || req.user.id;

    const result = await this.transactionsService.listTransactions(query);

    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      data: result.transactions,
    };
  }
}
