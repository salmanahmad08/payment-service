// src/api/subscriptions/subscriptions.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription } from './schemas/subscription.schema';
import {
  Transaction,
  TransactionDocument,
} from '../transactions/schemas/transaction.schema';

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,

    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  }

  async createSubscription(
    userId: string,
    planId: string,
    customerId: string,
    idempotencyKey: string,
  ) {
    if (!idempotencyKey)
      throw new BadRequestException('Idempotency key required');

    // ✅ Check for duplicate transaction
    const existingTxn = await this.transactionModel.findOne({ idempotencyKey });
    if (existingTxn) {
      return {
        message: 'Transaction already exists for this idempotency key',
        transaction: existingTxn,
      };
    }

    try {
      // ✅ Create Stripe subscription
      const stripeSubscription: Stripe.Subscription =
        await this.stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: planId }],
        });

      const planProvider = process.env.PLAN_PROVIDER || 'stripe';

      // ✅ Save subscription
      const newSub = await this.subscriptionModel.create({
        userId,
        provider: planProvider,
        providerSubId: stripeSubscription.id,
        planId,
        status: stripeSubscription.status,
        currentPeriodEnd: (stripeSubscription as any).current_period_end
          ? new Date((stripeSubscription as any).current_period_end * 1000)
          : new Date((stripeSubscription as any).billing_cycle_anchor * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      });

      // ✅ Save transaction
      const txn = await this.transactionModel.create({
        userId,
        provider: planProvider,
        providerTxnId: stripeSubscription.id,
        type: 'subscription',
        amount: (stripeSubscription as any)?.plan.amount / 100 || 0,
        currency: (stripeSubscription as any)?.currency || 'usd',
        status: 'success',
        idempotencyKey,
        meta: {
          subscriptionId: newSub._id.toString(),
          stripe: stripeSubscription,
        },
      });

      return { subscription: newSub, transaction: txn };
    } catch (err: any) {
      this.logger.error(err);
      return { error: true, message: err.message };
    }
  }
}
