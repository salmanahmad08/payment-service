import { Controller, Post, Req, Res, Headers } from '@nestjs/common';
import { StripeWebhookService } from './stripe.service';
import type { Request, Response } from 'express';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(private readonly stripeWebhookService: StripeWebhookService) {}

  @Post()
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    // Stripe requires raw body
    const payload = req['rawBody'];
    if (!payload) return res.status(400).send('No payload');

    try {
      await this.stripeWebhookService.handleEvent(
        Buffer.from(payload),
        signature,
      );
      return res.status(200).send('Webhook handled');
    } catch (err: any) {
      return res.status(400).send(`Webhook error: ${err.message}`);
    }
  }
}
