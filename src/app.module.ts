import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './api/users/users.module';
import { AuthModule } from './api/auth/auth.module';
import { SubscriptionsModule } from './api/subscriptions/subscriptions.module';
import { TransactionsModule } from './api/transactions/transactions.module';
import { PaymentsModule } from './api/payments/payments.module';
import { WebhooksModule } from './api/webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_URI as string),
    UsersModule,
    AuthModule,
    SubscriptionsModule,
    TransactionsModule,
    PaymentsModule,
    WebhooksModule,
  ],
})
export class AppModule {}
