import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ required: true })
  userId: string;

  @Prop({
    required: true,
    enum: ['stripe', 'moyasar'],
    default: 'stripe',
  })
  provider: string;

  @Prop({ required: true })
  providerSubId: string; // Stripe subscription ID

  @Prop({ required: true })
  planId: string;

  @Prop({
    required: true,
    enum: ['active', 'canceled', 'incomplete', 'past_due'],
  })
  status: string;

  @Prop({ required: false })
  cancelAtPeriodEnd?: boolean;

  @Prop({ type: Date, required: false })
  currentPeriodEnd?: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
