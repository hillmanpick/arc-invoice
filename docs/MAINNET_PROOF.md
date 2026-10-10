# Verified Arc mainnet payment

On October 10, 2026, the wallet owner signed a real 0.01 USDC payment through Arc Invoice. The app marked the invoice paid. We subsequently queried Arc JSON-RPC independently to verify the public transaction evidence.

| Evidence | Value |
| --- | --- |
| Network | Arc mainnet, chain ID 5042 (`0x13b2`) |
| Transaction | `0x5f0c162e485a55f72891c7acbee4a199bf4fe92eb187a37bdd67e6e0eeb1b25f` |
| Receipt status | `0x1` (success) |
| Block | 25197495 |
| Native USDC value | `10000000000000000` base units / 0.01 USDC |
| Recipient | `0xab9e4362ced96d403dab09e0561aded7b20e96d6` |
| Payer | `0x77048bf5b1f82460e049c85153ad356b488f7c4e` |
| Decoded transaction input | `ArcInvoice:v1:3df2e8e4-aff4-47bd-8924-a424fc682ee4` |
| Recipient code at payment block | `0x` |

[Live invoice receipt](https://170.106.189.16.sslip.io:8443/pay/3df2e8e4-aff4-47bd-8924-a424fc682ee4) · [Arc Explorer transaction](https://explorer.arc.io/tx/0x5f0c162e485a55f72891c7acbee4a199bf4fe92eb187a37bdd67e6e0eeb1b25f) · [Recorded public JSON-RPC results](mainnet-proof.json)

![Live confirmed invoice](mainnet-receipt.jpg)

The words “待付款” in the description were entered when the demonstration invoice was created; the actual status is `paid`. The screenshot is supporting UI evidence. The public transaction and RPC results provide independently checkable evidence. One developer demonstration payment is not a claim of external users or production volume.

## Reproduce without making a payment

Query the native transaction and receipt directly:

```bash
curl https://rpc.mainnet.arc.io \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"eth_getTransactionByHash","params":["0x5f0c162e485a55f72891c7acbee4a199bf4fe92eb187a37bdd67e6e0eeb1b25f"]}'

curl https://rpc.mainnet.arc.io \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","id":2,"method":"eth_getTransactionReceipt","params":["0x5f0c162e485a55f72891c7acbee4a199bf4fe92eb187a37bdd67e6e0eeb1b25f"]}'

curl https://170.106.189.16.sslip.io:8443/api/invoices/3df2e8e4-aff4-47bd-8924-a424fc682ee4
```

Check `eth_chainId` returns `0x13b2`. Confirm the transaction's `to`, `value` and decoded `input`; compare the transaction hash and block hash with the receipt. Query `eth_getBlockByHash` for the receipt's block hash and `eth_getCode` for the recipient at the receipt's block number. The recorded JSON includes those results and its check time.

The application uses [lib/payment.ts](../lib/payment.ts) for acceptance checks and [lib/db.ts](../lib/db.ts) for idempotent settlement and unique hashes. No signing key, session credential or database backup is included in the evidence.
