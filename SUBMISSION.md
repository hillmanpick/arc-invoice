# Arc Invoice — Arc Microgrants submission material

Prepared on October 10, 2026. This document is ready-to-copy application material, not a record of a submitted or approved application.

## Project name

Arc Invoice

## One-line summary

USDC payment links on Arc with invoice-bound transfers and verifiable onchain receipts.

## Project description

Arc Invoice is a deployed prototype for small merchants who need to match a wallet payment to an invoice. Merchants choose an amount and recipient for each invoice, optionally require a specific payer, then share a checkout link. Addresses and amounts are locked when the invoice is created. Customers confirm a native-USDC transfer from their own wallet on Arc mainnet. The app holds no signing keys or funds. Authenticated address history lets merchants reuse previous recipients and verified payers.

Each checkout transfer includes an invoice UUID in its transaction data. The server verifies the network, successful receipt, block consistency, exact recipient and amount, invoice reference, and transaction time before recording payment. A transaction hash cannot settle multiple invoices. Checkout pages automatically show the receipt once the server records payment, and preserve the transaction hash for recovery when available.

The app is live, has a public source repository, and has completed one real 0.01 USDC mainnet payment signed by the wallet owner. The interface defaults to English and supports Chinese, including application error messages. This is an early prototype; the completed payment demonstrates functionality, not customer adoption.

## How it uses Arc

Arc mainnet (chain ID 5042) is the payment and verification network. The app sends native USDC using 18-decimal precision, and network fees are also paid in USDC. It uses Arc JSON-RPC to validate transaction receipts. The invoice reference `ArcInvoice:v1:<UUID>` links the onchain transfer to the offchain invoice.

This implementation deliberately uses ordinary transactions rather than a custom payment contract. It reduces contract maintenance and avoids app custody, while limiting the prototype to supported direct transfers through its checkout. It uses EVM-compatible tools; the demonstrated integration is specifically configured and tested on Arc mainnet.

## Required links

| Field | URL |
| --- | --- |
| Live deployment | https://170.106.189.16.sslip.io:8443 |
| Public repository | https://github.com/hillmanpick/arc-invoice |
| Public builder profile | https://github.com/hillmanpick |
| Working receipt demo | https://170.106.189.16.sslip.io:8443/pay/3df2e8e4-aff4-47bd-8924-a424fc682ee4 |
| Mainnet transaction | https://explorer.arc.io/tx/0x5f0c162e485a55f72891c7acbee4a199bf4fe92eb187a37bdd67e6e0eeb1b25f |
| Evidence and reproduction | https://github.com/hillmanpick/arc-invoice/blob/main/docs/MAINNET_PROOF.md |

## Reviewer walkthrough

1. Open the live homepage and inspect the payment workflow. Switch EN / 中文 if desired.
2. Open the working receipt demo. No login or new payment is required to inspect the confirmed 0.01 USDC invoice and its receipt link.
3. Open the transaction in Arc Explorer or use the documented JSON-RPC requests. Compare the recipient, value and invoice reference against the stored invoice.
4. Inspect the source and run `npm ci`, `npm test`, and `npm run build` on a supported Node.js installation. Merchant invoice creation is protected by an admin token; the token is not published.

Do not pay the completed demonstration invoice again. A reviewer can self-host the source to create fresh invoices under their own configuration.

## Technical credibility and quality

- Next.js, React and TypeScript implement the UI and server API; viem provides wallet/RPC tooling.
- String/BigInt amount conversion avoids floating-point accounting. Payment validation rejects wrong networks, incorrect amounts or recipients, failed receipts, stale payments and mismatched invoice references.
- SQLite WAL, parameterized SQL and a unique transaction hash support persistent reconciliation and duplicate-payment protection. Docker volumes retain application data across container replacement.
- Nine automated payment/database tests cover payment validation, required payers, database migration, historical addresses and duplicate settlement. Production builds, browser checks and a real mainnet transfer provide separate forms of validation. Full details and limitations are public in VALIDATION.md.
- Responsive bilingual UI, automatic order-state checks, transaction-hash recovery and daily integrity-checked backups support the demonstration workflow.

## Current limitations and next steps

The prototype supports one operator login and one app instance, with configurable recipient wallets per invoice. It does not yet implement payment splitting, refunds, arbitrary transfer matching, contract-wallet internal transfers, a background chain indexer, or continuous offsite backup replication. It has not undergone an independent security audit. Public invoice links expose their invoice details, including required and actual payer addresses, to anyone holding the link; global address history requires admin authentication.

Further work would focus on automated offsite recovery, broader wallet testing and RPC recovery, followed by persistent rate limits and database changes if multi-instance operation is needed. No roadmap delivery commitment is implied by this application.

## Applicant declarations

The applicant confirmed the following on October 10, 2026:

- I have the right to submit and publicly share Arc Invoice, including the code and materials I provided.
- This project has not previously received funding from a Circle or Arc program.

These are applicant declarations, not independent legal or funding checks. The repository is published under its existing MIT license; third-party dependencies retain their respective licenses. Development used an AI coding assistant under the applicant's direction. The applicant deployed and tested the project and personally approved the demonstrated wallet transaction.

The organizer determines eligibility, including any jurisdiction screening and private verification required after conditional selection. Do not claim those organizer checks have already passed.

## Submission action still required

Use **Submit Build** on https://dorahacks.io/hackathon/arc-microgrants/detail and supply the required links and description. Registration alone is not a project submission. One submission per project; check the account for an existing build before creating a duplicate.

The event page checked on October 10, 2026 states October 14, 2026 at 23:59 ET, equivalent to **October 15, 2026 at 11:59 Asia/Shanghai**. The organizer may adjust dates. No grant award is guaranteed.
