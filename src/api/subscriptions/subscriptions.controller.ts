// src/api/subscriptions/subscriptions.controller.ts
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
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Controller('payments/subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  async create(
    @Req() req,
    @Body() body: CreateSubscriptionDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    // ✅ Check Idempotency header
    if (!idempotencyKey) {
      throw new BadRequestException('Missing Idempotency-Key header');
    }

    const userId = req.user.id;

    return this.subscriptionsService.createSubscription(
      userId,
      body.planId,
      body.customerId,
      idempotencyKey,
    );
  }
}
