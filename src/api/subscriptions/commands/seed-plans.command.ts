import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plan, PlanDocument } from '../schemas/plan.schema';

@Injectable()
export class SeedPlansCommand {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(SeedPlansCommand.name);

  constructor(@InjectModel(Plan.name) private planModel: Model<PlanDocument>) {
    // Stripe secret from env
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }

  async run() {
    try {
      this.logger.log('🚀 Seeding Stripe Product and Plan...');

      // Env variables
      const planName = process.env.STRIPE_PLAN_NAME || 'Premium Subscription';
      const planAmount = parseInt(process.env.STRIPE_PLAN_AMOUNT || '5000'); // cents
      const planCurrency = process.env.STRIPE_PLAN_CURRENCY || 'usd';
      const planInterval = process.env.STRIPE_PLAN_INTERVAL || 'month';
      const planProvider = process.env.PLAN_PROVIDER || 'stripe';
      const planIntervalCount = parseInt(
        process.env.STRIPE_PLAN_INTERVAL_COUNT || '1',
      );

      // ✅ Check if plan already exists
      const existingPlan = await this.planModel
        .findOne({ product: planName })
        .exec();
      if (existingPlan) {
        this.logger.log(
          `⚠️ Plan "${planName}" already exists. Skipping creation.`,
        );
        return existingPlan;
      }

      // 1️⃣ Create Stripe Product
      const product = await this.stripe.products.create({
        name: planName,
        description:
          process.env.STRIPE_PLAN_DESCRIPTION || 'Monthly Premium Plan',
      });

      // 2️⃣ Create Stripe Plan
      const planStripe = await this.stripe.plans.create({
        amount: planAmount,
        currency: planCurrency,
        interval: planInterval as Stripe.PlanCreateParams.Interval,
        interval_count: planIntervalCount,
        product: product.id,
      });

      // 3️⃣ Save to MongoDB
      const plan = await this.planModel.create({
        amount: planStripe.amount,
        currency: planStripe.currency,
        interval: planStripe.interval,
        interval_count: planStripe.interval_count,
        product: product.id,
        providerPlanId: planStripe.id,
        provider: planProvider,
      });

      this.logger.log(`✅ Plan saved to DB: ${plan._id}`);
      return plan;
    } catch (err) {
      this.logger.error(err.message);
      return { error: true, message: err.message };
    }
  }
}
