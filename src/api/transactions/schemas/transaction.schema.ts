import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['one-time', 'subscription'], // simple type enum
  })
  type: string;

  @Prop({
    required: true,
    enum: ['success', 'pending', 'failed', 'refunded', 'canceled'], // simple status enum
  })
  status: string;

  @Prop({
    required: true,
    enum: ['stripe', 'moyasar'], // simple provider enum
  })
  provider: string;

  @Prop()
  providerTxnId?: string;

  @Prop({ required: true })
  amount: number;
  @Prop()
  refundId?: string;
  @Prop()
  currency?: string;

  @Prop()
  idempotencyKey?: string;

  @Prop({ type: Object })
  meta?: Record<string, any>;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
