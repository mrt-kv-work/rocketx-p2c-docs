# P2C: Order / Redirect

## Integration Flow

```mermaid
sequenceDiagram
    participant C as Customer
    participant M as Merchant
    participant R as RocketX
    M->>R: POST /eapi/orders
    R->>R: Validate and create request
    alt Request rejected
        R-->>M: API error
    else Request accepted
        R-->>M: Request ID, status and form_uri
        M-->>C: Redirect to form_uri
        C->>R: Open hosted page
        alt Requisites already allocated
            R-->>C: Show payment details and status
        else Payment details required
            C->>R: Submit method, amount and customer data
            R->>R: Validate and save submitted data
            R->>R: Attempt to allocate requisites
            R-->>C: Payment details or form error
        end
        opt Payment details available
            C->>C: Transfer the displayed amount to requisites
        end
        opt Status changes and callback configured
            R-->>M: Status callback
        end
        opt Merchant checks status
            M->>R: POST /eapi/orders/get
            R-->>M: Current operation data
        end
    end
    Note over C,R: Creating a request or returning to the merchant does not confirm completion
```

Use redirect when the customer must continue on the hosted payment page.

1. The partner creates an order through `POST /eapi/orders` and checks the
   response for errors. Argentina P2C requires `cuit` at this step.
2. On success, the partner redirects the customer to the returned `form_uri`.
3. If an order has already been allocated, the hosted page displays its
   payment details and status.
4. Otherwise, the customer completes the payment method, amount, and required
   customer details on the hosted page. The form submits these to RocketX.
5. RocketX validates the data and attempts to allocate payment requisites.
   On success, the page displays the payment details; otherwise it shows an error.
6. The customer makes the payment to the displayed requisites. The partner
   tracks the result through callbacks or Get Order Status.

`form_uri` is the hosted payment page. `form_options.redirect_url` is the
partner return link on the hosted page. Returning to the partner does not
confirm payment; check the API status or callback.

## HTTP Request
```http
POST /eapi/orders
Content-Type: application/json
```

The request must be signed. See [Signature](./signature.md).

## Request Body

Use the exact `payment_type` tag enabled for your merchant, currency, and
operation. Availability is configured separately for orders and withdraws.
The tags in the examples are illustrative; replace them with your enabled tags.

```json
{
  "user_cid": "client-1",
  "currency": "ARS",
  "amount": 100.55,
  "cid": "order-128",
  "merchant_cid": "merchant-2",
  "description": "Order description",
  "fio": "Juan Perez",
  "fingerprint": "customer-fingerprint",
  "callback_url": "https://merchant.example/callbacks/orders",
  "cuit": "20112223334",
  "form_options": {
    "redirect_url": "https://merchant.example/orders/order-128"
  }
}
```

## Request Parameters

| Parameter | Type | Required | Description |
|---|---:|:---:|---|
| `user_cid` | string | Yes | Customer ID in the partner system. |
| `currency` | string | Yes | Use `ARS`. |
| `payment_type` | string | No | Payment method tag enabled for the partner. If omitted, the method can be selected on the hosted page. |
| `amount` | number | Yes | Fiat amount. Use `0` only when amount selection is expected on the hosted page. |
| `cid` | string | Yes | Unique order ID in the partner system. |
| `merchant_cid` | string | No | Merchant-side identifier from the partner system. |
| `description` | string | No | Order description. |
| `fio` | string | No | Customer full name when required by the selected flow or payment method. |
| `fingerprint` | string | Yes | Customer fingerprint used to identify the same customer across accounts. |
| `callback_url` | string | No | URL where RocketX sends order status callbacks. |
| `enable_amount_increment_logic` | boolean | No | Accepted request field. Use only if this option is enabled for the partner. |
| `form_options` | object | No | Hosted form options. |
| `phone_number` | string | No | Customer phone number when required by the selected payment method. |
| `cuit` | string | Yes | Customer CUIT. Required at creation for both H2H and redirect. Send 11 digits without separators. |

### form_options

| Parameter | Type | Required | Description |
|---|---:|:---:|---|
| `redirect_url` | string | No | Destination of the return link on the hosted payment page. It does not confirm payment. |

The example omits `payment_type` so the customer can select it on the hosted
page. If a method and positive amount are supplied, RocketX attempts to allocate
requisites immediately; the hosted page then displays the allocated details.

## Successful Response

```json
{
  "status": "created",
  "amount": 100.55,
  "order_id": "430551eecdb8ecb842621cce",
  "requisites": null,
  "timer": null,
  "form_uri": "https://uragan.cash/external/orders/430551eecdb8ecb842621cce",
  "canceled_reason": ""
}
```

| Parameter | Type | Description |
|---|---:|---|
| `status` | string | Current order request status. |
| `amount` | number | Final amount assigned to the order. |
| `order_id` | string | RocketX order ID. Use it for status requests and callbacks reconciliation. |
| `requisites` | object, null | Payment requisites. Returned when requisites are allocated. |
| `timer` | integer, null | Countdown deadline as a Unix timestamp in seconds. `0` means no countdown; `null` means no associated order. |
| `form_uri` | string | Hosted payment page URL. |
| `canceled_reason` | string | Cancel reason code. Empty unless the order is canceled. |

## Requisites

The `requisites` object depends on the selected payment method.

| Payment method type | Requisites fields |
|---|---|
| Account number only | `account_number` |
| Argentina bank transfer (`ACCOUNTARS`) | `account_number`, `bank`, `fio` |
| Argentina QR | `qr`, `qr_data` |
| Other card/account methods | `number`, `bank`, `fio` |

These rows describe response shapes, not values to send as `payment_type`
or a list of methods enabled for your merchant.

For an Argentina bank transfer configured for other banks, `bank` is an
empty string.

## Error Responses
The same API error format applies to H2H and redirect creation. On an error,
`form_uri` is not returned. See [Errors](./errors.md) for the full response
summary.

Authentication errors return HTTP `401`.

```json
{
  "message": "Bad credentials"
}
```

Validation or business errors return HTTP `400`.

```json
{
  "errors": {
    "base": ["no_requisite"]
  }
}
```

```json
{
  "errors": {
    "payment_type": ["is invalid"]
  }
}
```

Internal errors return HTTP `500`.

```json
{
  "errors": {
    "base": ["Internal error"]
  }
}
```

## Notes

- If the customer is blocked, the response contains `banned_client`.
- If no requisites are available, the response contains `no_requisite`.
- If the amount is outside the allowed limits, the response can contain
  `AMOUNT_OUT_OF_LIMIT`.
- `cid` must be unique for the partner.

## Track an Order

[Get Order Status](./order-status.md) or receive [callbacks](./callback.md).
