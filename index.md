# P2C API

P2C payment API reference for Argentina. Use `ARS` for orders and withdraws.

## Contents

- [Signature](./guides/signature.md)
- [Order](./guides/order.md)
- [Withdraw](./guides/withdraw.md)
- [Statuses](./guides/statuses.md)
- [Errors](./guides/errors.md)
- [Callback](./guides/callback.md)
- [API Reference](./reference.html ':ignore')

## Flow Options

P2C supports two integration options:

- H2H: the partner sends all required data through the API.
- Redirect: the partner creates a request and redirects the customer to the
  hosted page. Orders can collect missing payment details there. Withdraws
  require payout details at creation; the hosted page displays the status.

Order and withdraw flows are documented separately because request fields,
requisites, and responses differ by operation type.
