import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreateChargeDto } from './dto/create-charge.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('charges')
  async createCharge(
    @Req() req,
    @Body() body: CreateChargeDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    if (!idempotencyKey)
      throw new BadRequestException('Missing Idempotency-Key header');
    const userId = req.user.id;
    return this.paymentsService.createCharge(userId, body, idempotencyKey);
  }

  @Post('refund')
  async refundCharge(@Headers('idempotency-key') idempotencyKey?: string) {
    if (!idempotencyKey)
      throw new BadRequestException('Missing Idempotency-Key header');
    return this.paymentsService.refundChargeByIdempotencyKey(idempotencyKey);
  }
}
