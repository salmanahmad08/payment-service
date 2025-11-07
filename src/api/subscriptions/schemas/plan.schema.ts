import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlanDocument = Plan & Document;

@Schema({ timestamps: true })
export class Plan {
  @Prop({ required: true })
  amount: number; // in cents

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  interval: string; // 'month', 'year'

  @Prop({ required: true, default: 1 })
  interval_count: number;

  @Prop({ required: true })
  product: string; // Stripe product ID

  @Prop({
    required: true,
    enum: ['stripe', 'moyasar'],
  })
  provider: string;

  @Prop({ required: true })
  providerPlanId: string; // Stripe price ID
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
