# P2C: Callback

RocketX sends callbacks to the `callback_url` provided in the order or withdraw
request.

Callbacks are sent when the request status changes. If `callback_url` is not
provided, no callback is sent.

See [Statuses](./statuses.md) for status values and cancellation reason codes.

## Callback Request

RocketX sends a signed `POST` request to the partner callback URL.

```http
POST {callback_url}
Content-Type: application/json
PublicKey: merchant-public-key
Timestamp: 1754549516
Signature: generated-hmac-sha512-hex-string
```

The callback signature is generated with the same rule as API requests:

```text
Signature = HMAC-SHA512(private_key, Timestamp + raw_callback_body)
```

The partner should verify the signature using the raw callback body.

## Order Callback Body

```json
{
  "order_id": "430551eecdb8ecb842621cce",
  "cid": "order-128",
  "status": "closed",
  "canceled_reason": "",
  "timer": 0,
  "currency": "ARS",
  "payment_type": "ACCOUNTARS",
  "amount_in_currency": 100.55,
  "rate": 1,
  "full_amount": 100.55,
  "commission": 0,
  "amount": 100.55,
  "created_at": "2026-09-05T10:00:00.000Z",
  "updated_at": "2026-09-05T10:05:00.000Z",
  "description": "Order description",
  "merchant_cid": "merchant-2",
  "user_cid": "client-1",
  "fio": "Juan Perez",
  "dni": "11222333",
  "fingerprint": "customer-fingerprint",
  "callback_url": "https://merchant.example/callbacks/orders",
  "form_options": {
    "redirect_url": "https://merchant.example/orders/order-128"
  }
}
```

| Field | Description |
|---|---|
| `order_id` | RocketX order ID. |
| `cid` | Partner order ID. |
| `status` | Current order request status. |
| `canceled_reason` | Cancel reason code. Empty unless the order is canceled. |
| `timer` | Countdown deadline as a Unix timestamp in seconds. `0` means no countdown; `null` means no associated order. |
| `currency` | Order currency. |
| `payment_type` | Payment method tag. |
| `amount_in_currency` | Current order amount in request currency. May differ from the requested amount. |
| `rate` | Exchange rate used for the operation. |
| `full_amount` | Merchant amount after commission is deducted, in the merchant balance currency. |
| `commission` | Merchant commission. |
| `amount` | Order amount before commission, in the merchant balance currency. |
| `created_at` | Operation creation timestamp. |
| `updated_at` | Last operation update timestamp. |
| `description` | Description from the original request. |
| `merchant_cid` | Merchant-side identifier from the original request. |
| `user_cid` | Customer ID in the partner system. |
| `fio` | Customer full name, if provided. |
| `client_name` | Included when enabled for the merchant. Customer name obtained from the payment notification, or `null` if unavailable. |
| `dni` | Argentina DNI derived from CUIT when CUIT is present. |
| `fingerprint` | Customer fingerprint from the original request. |
| `callback_url` | Callback URL from the original request. |
| `form_options` | Hosted form options from the original request. |

When enabled for the merchant and supplied by the payment provider, order
callbacks can also include `client_cvu` (customer account number) and
`client_cuit` (customer tax ID). Both fields are omitted if neither value is
available. If only one is available, the other field is `null`.

## Withdraw Callback Body

```json
{
  "withdraw_id": "430551eecdb8ecb842621cce",
  "cid": "withdraw-128",
  "status": "closed",
  "canceled_reason": "",
  "currency": "ARS",
  "payment_type": "ACCOUNTARS",
  "requisite": {
    "account_number": "1234567890123456789012",
    "cuit": "20112223334"
  },
  "amount_in_currency": 100.55,
  "rate": 1,
  "full_amount": 100.55,
  "commission": 0,
  "amount": 100.55,
  "created_at": "2026-09-05T10:00:00.000Z",
  "updated_at": "2026-09-05T10:05:00.000Z",
  "description": "Withdraw description",
  "merchant_cid": "merchant-2",
  "user_cid": "client-1",
  "fingerprint": "customer-fingerprint",
  "callback_url": "https://merchant.example/callbacks/withdraws",
  "form_options": {
    "redirect_url": "https://merchant.example/withdraws/withdraw-128"
  }
}
```

| Field | Description |
|---|---|
| `withdraw_id` | RocketX withdraw ID. |
| `cid` | Partner withdraw ID. |
| `status` | Current withdraw request status. |
| `canceled_reason` | Cancel reason code. Empty unless the withdraw is canceled. |
| `currency` | Withdraw currency. |
| `payment_type` | Payment method tag. |
| `requisite` | Customer payout requisite accepted by RocketX. |
| `amount_in_currency` | Original operation amount in request currency. |
| `rate` | Exchange rate used for the operation. |
| `full_amount` | Merchant amount including commission, in the merchant balance currency. |
| `commission` | Merchant commission. |
| `amount` | Withdraw amount excluding commission, in the merchant balance currency. |
| `created_at` | Operation creation timestamp. |
| `updated_at` | Last operation update timestamp. |
| `description` | Description from the original request. |
| `merchant_cid` | Merchant-side identifier from the original request. |
| `user_cid` | Customer ID in the partner system. |
| `fingerprint` | Customer fingerprint from the original request. |
| `callback_url` | Callback URL from the original request. |
| `form_options` | Hosted form options from the original request. |

## Partner Response

Return HTTP `200` after the callback is processed.

Order callbacks accept any HTTP `2xx` response. Withdraw callbacks require
HTTP `200`; other status codes trigger a retry.

Failed callback requests, including timeouts, are retried up to 3 times.
The callback request timeout is 10 seconds.
