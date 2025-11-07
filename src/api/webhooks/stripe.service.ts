import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Subscription,
  SubscriptionDocument,
} from '../subscriptions/schemas/subscription.schema';
import {
  Transaction,
  TransactionDocument,
} from '../transactions/schemas/transaction.schema';

@Injectable()
export class StripeWebhookService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  }

  async handleEvent(payload: Buffer, signature: string) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        endpointSecret,
      );
    } catch (err: any) {
      this.logger.error(
        `Webhook signature verification failed: ${err.message}`,
      );
      throw err;
    }

    this.logger.log(`Received Stripe event: ${event.type}`);

    switch (event.type) {
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        this.logger.warn(`Unhandled Stripe event type: ${event.type}`);
    }
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    const {
      id,
      cancel_at_period_end,
      current_period_start,
      current_period_end,
      billing_cycle_anchor,
    } = subscription as any;

    await this.subscriptionModel.findOneAndUpdate(
      { providerSubId: id },
      {
        status: 'active',
        cancelAtPeriodEnd: cancel_at_period_end,
        currentPeriodStart: current_period_start
          ? new Date(current_period_start * 1000)
          : null,
        currentPeriodEnd: current_period_end
          ? new Date(current_period_end * 1000)
          : billing_cycle_anchor
            ? new Date(billing_cycle_anchor * 1000)
            : null,
      },
      { upsert: true, new: true },
    );

    this.logger.log(`Subscription created/updated: ${id}`);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const {
      id,
      cancel_at_period_end,
      current_period_start,
      current_period_end,
      latest_invoice,
      billing_cycle_anchor,
    } = subscription as any;

    const sub = await this.subscriptionModel.findOneAndUpdate(
      { providerSubId: id },
      {
        status: 'active',
        cancelAtPeriodEnd: cancel_at_period_end,
        currentPeriodStart: current_period_start
          ? new Date(current_period_start * 1000)
          : null,
        currentPeriodEnd: current_period_end
          ? new Date(current_period_end * 1000)
          : billing_cycle_anchor
            ? new Date(billing_cycle_anchor * 1000)
            : null,
      },
      { upsert: true, new: true },
    );

    if (sub) {
      await this.transactionModel.create({
        subscriptionId: sub._id,
        amount: 0,
        currency: 'usd',
        status: 'pending',
        stripePaymentIntentId: latest_invoice ? latest_invoice.toString() : '',
      });

      this.logger.log(
        `New transaction created for updated subscription: ${id}`,
      );
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = ((invoice as any).subscription as string) || '';
    const paymentIntentId = ((invoice as any).payment_intent as string) || '';

    const sub = await this.subscriptionModel.findOne({
      providerSubId: subscriptionId,
    });
    if (!sub) return;

    await this.transactionModel.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntentId },
      {
        subscriptionId: sub._id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
        status: 'failed',
        stripePaymentIntentId: paymentIntentId,
      },
      { upsert: true, new: true },
    );

    this.logger.warn(
      `Payment failed transaction recorded for subscription: ${subscriptionId}`,
    );
  }
}
