# P2C: Statuses

The `status` field is returned by the create and status lookup endpoints and
in [callbacks](./callback.md).

## Operation Statuses

| Status | Order | Withdraw |
|---|---|---|
| `created` | Request created; processing has not started. | Request created; not yet activated for processing. |
| `active` | Request activated; an intermediate processing state. | Request activated for payout processing. |
| `in_work` | Payment processing is in progress. | Payout processing is in progress. |
| `closed` | Payment completed successfully. | Payout completed successfully. |
| `canceled` | Payment request canceled. | Payout request canceled. |

Creating a request does not confirm a completed payment or payout. Read the
latest status through callbacks or the status lookup endpoint.

Statuses are not guaranteed to progress only forward. An order can move from
`canceled` back to `in_work`, and a withdraw can move from `in_work` back to
`active`. Both operations can move from `closed` to `canceled` if completion
is reversed. Continue to process subsequent status updates.

## Order Cancellation Reasons

When an order request is `canceled`, `canceled_reason` contains its cancellation
reason when available. It can be `null` when no reason is available. For other
statuses, the field is an empty string.

| Code | Meaning |
|---|---|
| `no_deposit` | No deposit received. |
| `error_deposit` | Transfer error. |
| `wrong_amount` | Wrong payment amount. |
| `merchant_request` | Canceled at the merchant's request. |
| `invalid_requisite` | Invalid payment requisite. |
| `return` | Refund to customer. |
| `internal_error` | Internal processing error. |
| `duplicate` | Duplicate operation. |
| `timeout` | Payment timeout. |

## Withdraw Cancellation Reasons

When a withdraw request is `canceled`, `canceled_reason` contains its
cancellation reason. For other statuses, it is an empty string.

| Code | Meaning |
|---|---|
| `invalid_requisite` | Invalid payout requisite. |
| `no_balance` | Insufficient merchant balance. |
| `recipient_error` | Recipient-side error. |
| `internal_error` | Internal processing error. |
| `merchant_request` | Canceled at the merchant's request. |
| `fraud_risk` | Fraud risk. |
| `timeout` | Withdraw request timeout. |

Cancellation reasons describe an existing operation. Request validation errors
are described separately in [Errors](./errors.md).

