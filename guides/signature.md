# P2C: Signature

All P2C API requests must be signed.

## Required Headers

| Header | Required | Description |
|---|:---:|---|
| `PublicKey` | Yes | Partner public key issued by RocketX. |
| `Signature` | Yes | Request signature generated with the partner private key. |
| `Timestamp` | Yes | Current Unix timestamp in UTC seconds. |
| `Content-Type` | Yes | Use `application/json` for JSON requests. |

Requests with an invalid key, invalid signature, or expired timestamp return
HTTP `401`.

Generate a fresh timestamp for every request. A timestamp 30 seconds or more
behind the server time is rejected. Keep your system clock synchronized.

## Signature Formula

Generate the signature from the exact request body that is sent to the API.

```text
Signature = HMAC-SHA512(private_key, Timestamp + raw_request_body)
```

Where:

| Part | Description |
|---|---|
| `private_key` | Partner private key issued by RocketX. Do not send it in requests. |
| `Timestamp` | Same value as the `Timestamp` request header. |
| `raw_request_body` | JSON request body exactly as sent, without reformatting, sorting, trimming, or changing spaces and line breaks. |

The result must be sent as a lowercase hex string in the `Signature` header.

## Example

Request body:

```json
{"user_cid":"client-1","currency":"ARS","payment_type":"ACCOUNTARS","amount":100.55,"cid":"order-128","fingerprint":"customer-fingerprint","callback_url":"https://merchant.example/callbacks/orders","cuit":"20112223334"}
```

Send this example body as one line without a trailing newline. The timestamp
below is illustrative; use the current Unix timestamp for an actual request.

String to sign:

```text
1754549516{"user_cid":"client-1","currency":"ARS","payment_type":"ACCOUNTARS","amount":100.55,"cid":"order-128","fingerprint":"customer-fingerprint","callback_url":"https://merchant.example/callbacks/orders","cuit":"20112223334"}
```

Headers:

```http
Content-Type: application/json
PublicKey: merchant-public-key
Timestamp: 1754549516
Signature: generated-hmac-sha512-hex-string
```

## Important Rules

- Sign the raw body bytes exactly as they are sent.
- Do not generate the signature from a parsed or reformatted JSON object.
- Do not include `PublicKey` in the signed string.
- Do not send `private_key` in any request.
- Use a fresh timestamp. The API rejects old timestamps.
