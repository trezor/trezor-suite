# Screen-by-screen source audit

Audit date: 15 November 2026 (updated with later route-coverage checks). This supplement reconciles desktop/web page composition and native screens against the existing user feature map. It added **18 capabilities** (bringing the catalog to 596 at the time; later source additions brought it to **627** in [summary.json](../summary.json)), each with all existing metadata and four test-quality assessments.

## Scope and method

Three independent reviewers covered desktop wallet, desktop administration/services, and native mobile. Desktop review has explicit dispositions for all **51 page files**. Native review reconciled **222 registrations across 36 navigators**; the integration follow-up also read 17 additional Screen-suffixed components/helpers, reconciling all **217 `*Screen.tsx` files**. The mobile ledger has 224 screen/state/helper entries (including component-path rows for the inline passphrase-mismatch and passphrase-duplicate alerts); these are distinct counts, not unique registered routes.

Supporting desktop control excerpts are marked separately. File enumeration, imported controls and registered routes do not prove every dynamic provider/device branch or runtime reachability. Shared presentation wrappers, loading states, internal screens and aliases have explicit dispositions instead of becoming artificial capabilities. No application flows or E2E/manual suites were executed in this pass; the existing 238 captures are preserved and no new screenshots were taken.

## Added capabilities

Scores are desktop automated / Android automated / desktop manual / Android manual. A supported feature with score0 has no applicable verification found in the inspected source; parent tests are not inherited.

| ID                                                 | Capability                                     | Scores        |
| -------------------------------------------------- | ---------------------------------------------- | ------------- |
| `wallet.send.form.draft`                           | Resume an unfinished send                      | 0 / 0 / 0 / 0 |
| `wallet.transactions.details.price-change`         | Compare transaction-time and current value     | 0 / 0 / 0 / 4 |
| `wallet.transactions.export.filtered`              | Export matching transactions                   | 0 / 0 / 0 / 0 |
| `wallet.tokens.stellar.remove-contract`            | Remove a watched Stellar contract token        | 0 / 0 / 0 / 0 |
| `wallet.sign-verify.clear`                         | Clear a completed message operation            | 6 / 0 / 0 / 0 |
| `earn.opportunities.total-balance`                 | Total earning balance                          | 0 / 0 / 0 / 0 |
| `earn.opportunities.balance-breakdown`             | Earning balance allocation                     | 0 / 0 / 0 / 0 |
| `earn.opportunities.expand`                        | Expand earning opportunity accounts            | 0 / 0 / 0 / 0 |
| `earn.yield.retry`                                 | Retry loading yield opportunities              | 0 / 0 / 0 / 0 |
| `earn.feedback`                                    | Rate an earning flow                           | 0 / 0 / 0 / 0 |
| `help.support.system-info`                         | Choose support diagnostic sharing              | 0 / 0 / 0 / 0 |
| `trade.swap.risk-review`                           | Review swap risk warnings                      | 1 / 0 / 0 / 0 |
| `wallet-access.hidden.duplicate`                   | Resolve a duplicate hidden wallet              | 3 / 0 / 0 / 0 |
| `app-settings.log.sensitive-data`                  | Application log sensitive-data preference      | 0 / 0 / 0 / 0 |
| `device-settings.check-backup.web-fallback`        | Continue unsupported backup check in Suite Web | 0 / 0 / 0 / 0 |
| `wallet.tokens.stellar.fees`                       | Stellar token management fee selection         | 0 / 0 / 0 / 0 |
| `wallet.tokens.stellar.manual.contract-resolution` | Resolve a Stellar asset contract identifier    | 0 / 0 / 0 / 0 |
| `app-settings.application.blocking-message`        | Blocking service announcement                  | 0 / 0 / 0 / 0 |

## Material findings and open questions

- Diagnostic sensitive-data defaults differ: desktop/web starts with sensitive information included; Android starts with it excluded. The written desktop log expectation does not verify switching that preference. The new control remains score0.
- Risky swap review differs by platform: desktop can offer Continue anyway, while the native simulation-issue footer offers Back to trade form. Do not treat them as equivalent confirmation paths.
- Duplicate hidden-wallet recovery differs: mobile offers switching to the existing wallet; desktop additionally offers trying another passphrase. Desktop E2E verifies the warning, not resolution outcomes (score3).
- Stellar contract-ID lookup succeeds into classic asset/issuer on both platforms. On failed lookup desktop/web can classify a Soroban contract token; native shows an unknown-contract error. Fee selection for activation/deactivation exists on both platforms and is distinct from Send fees.
- Receive history was incorrectly described as expandable rows. The catalog now describes direct row actions. Its desktop manual score was reduced from4 to1: the written procedure checks historical addresses are listed but does not exercise their row actions.
- Most newly distinguished controls have no direct applicable test verification. This identifies missing or insufficiently explicit scenarios, not runtime failures.
- Five existing mobile parity questions remain unknown: generic render-error recovery, bootloader-update flow, contextual account/token-preselected Trade entry, Connect account-export selection and Suite Sync connection status. Source limitations are recorded in the mobile audit; no availability was guessed.
- Product-team ownership is inferred from domain/code context. CODEOWNERS identifies review assignment, not confirmed product accountability.

## Evidence and verification

- [Desktop wallet ledger](./desktop-wallet.json)
- [Desktop administration and services ledger](./desktop-administration-services.json)
- [Mobile screen and navigator ledger](./mobile.json)
- [Source fingerprints and completeness report](./verification.json)
- [Explicit baseline migration](./baseline-migration.json)

The baseline migration preserves old feature IDs, captures and semantic data except the documented receive-history correction. Only derived ordering/leaf fields change elsewhere. Before/after hashes and exact record deltas are retained; no original screenshot was replaced.

[Route coverage](./route-coverage.md) ([JSON](./route-coverage.json)) is the route completeness check for mobile and desktop/web: [routes.ts](./routes.ts) lists every registered native route and every desktop/web route from source and joins them with these ledgers (or, for a component without a ledger row, features whose implementation evidence is that component), runtime screenshots and capture flows. `node docs/features/feature-map/screen-audit/routes.ts` regenerates both files; `--check` exits non-zero when they are stale. Static parsing shows that a route is registered, not that it is reachable at runtime.

Run from the repository root:

```sh
node docs/features/feature-map/build.ts
node docs/features/feature-map/verify.ts
node docs/features/feature-map/screen-audit/verify.ts
```

These artifact checks validate IDs, references, hierarchy, exports, scores and screenshot hashes. The screen verifier reports files lacking ledger entries instead of counting them as reviewed. JSON Schema2020-12 was separately checked with the installed Ajv validator.
