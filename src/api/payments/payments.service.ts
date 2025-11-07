import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
} from '../transactions/schemas/transaction.schema';
import { CreateChargeDto } from './dto/create-charge.dto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  }

  // ✅ Create one-time payment
  async createCharge(
    userId: string,
    dto: CreateChargeDto,
    idempotencyKey: string,
  ) {
    if (!idempotencyKey)
      throw new BadRequestException('Idempotency key required');

    const existingTxn = await this.transactionModel.findOne({ idempotencyKey });
    if (existingTxn)
      return {
        message: 'Transaction already exists',
        transaction: existingTxn,
      };

    try {
      const paymentIntent = await this.stripe.paymentIntents.create(
        {
          amount: dto.amount,
          currency: dto.currency,
          customer: dto.customerId,
          payment_method: 'pm_card_visa',
          confirm: true,
          off_session: true,
        },
        { idempotencyKey },
      );

      if (paymentIntent.status === 'succeeded') {
        const txn = await this.transactionModel.create({
          userId,
          provider: 'stripe',
          providerTxnId: paymentIntent.id,
          type: 'one-time',
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: 'success',
          idempotencyKey,
          meta: paymentIntent,
        });

        return { transaction: txn, stripeResponse: paymentIntent };
      } else {
        return {
          error: true,
          message: 'Payment failed',
          stripeResponse: paymentIntent,
        };
      }
    } catch (err: any) {
      this.logger.error(err);
      return { error: true, message: err.message };
    }
  }

  // ✅ Refund by idempotencyKey
  async refundChargeByIdempotencyKey(idempotencyKey: string) {
    if (!idempotencyKey)
      throw new BadRequestException('Idempotency key required');

    // Find transaction in DB
    const txn = await this.transactionModel.findOne({ idempotencyKey });
    if (!txn) throw new BadRequestException('Transaction not found');

    if (txn.status === 'refunded') {
      return { message: 'Transaction already refunded', transaction: txn };
    }

    try {
      // Create refund in Stripe
      const refund = await this.stripe.refunds.create({
        payment_intent: txn.providerTxnId,
        amount: txn.amount * 100, // convert units back to cents
      });

      // Only update DB if refund succeeded
      if (refund.status === 'succeeded') {
        txn.status = 'refunded';
        txn.refundId = refund.id;
        await txn.save();
      }

      return { refund, transaction: txn };
    } catch (err: any) {
      this.logger.error(err);
      return { error: true, message: err.message };
    }
  }
}
