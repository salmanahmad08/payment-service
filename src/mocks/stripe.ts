export const Stripe = {
  subscriptions: {
    create: jest.fn().mockResolvedValue({
      id: 'sub_mock_123',
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
      cancel_at_period_end: false,
      plan: { amount: 1000, currency: 'usd' },
      currency: 'usd',
    }),
  },
  paymentIntents: {
    create: jest
      .fn()
      .mockResolvedValue({
        id: 'pi_mock_123',
        status: 'requires_payment_method',
      }),
    retrieve: jest
      .fn()
      .mockResolvedValue({ id: 'pi_mock_123', status: 'succeeded' }),
    confirm: jest
      .fn()
      .mockResolvedValue({ id: 'pi_mock_123', status: 'succeeded' }),
    cancel: jest
      .fn()
      .mockResolvedValue({ id: 'pi_mock_123', status: 'canceled' }),
  },
  refunds: {
    create: jest
      .fn()
      .mockResolvedValue({ id: 're_mock_123', status: 'succeeded' }),
  },
  invoices: {
    retrieve: jest
      .fn()
      .mockResolvedValue({
        id: 'inv_mock_123',
        subscription: 'sub_mock_123',
        payment_intent: 'pi_mock_123',
      }),
  },
};
