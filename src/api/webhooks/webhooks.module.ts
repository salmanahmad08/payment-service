import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StripeWebhookService } from './stripe.service';
import {
  Subscription,
  SubscriptionSchema,
} from '../subscriptions/schemas/subscription.schema';
import {
  Transaction,
  TransactionSchema,
} from '../transactions/schemas/transaction.schema';
import { StripeWebhookController } from './stripe.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [StripeWebhookController],
  providers: [StripeWebhookService],
})
export class WebhooksModule {}
