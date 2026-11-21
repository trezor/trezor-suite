# Test coverage quality

Each feature has four independent integer scores from **0 to 10**:

| Field               | Scope                                                                                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `desktop_automated` | Automated Playwright coverage of the computer desktop/web UI, respecting web/Electron project restrictions. Electron-only capabilities require compatible desktop scenarios. |
| `android_automated` | Android-capable native Detox E2E scenarios. iOS-only cases are excluded.                                                                                                     |
| `desktop_manual`    | Quality of applicable written computer desktop/web manual scenarios.                                                                                                         |
| `android_manual`    | Quality of applicable written Android/native manual scenarios.                                                                                                               |

These are source-based judgments of **what the tests verify**, not pass rates, code coverage, test counts, production quality scores, or proof that a manual procedure was executed. The previous runtime walkthrough and its screenshots are not counted as test-suite coverage. Unit tests, uninvoked page-object helpers and injected fixture state do not establish an E2E user journey.

## Scale

| Score | Meaning                                                                                                                                                                                   |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | No active, applicable verification found. Relevant disabled tests, iOS-only cases, placeholders or obsolete procedures may be recorded as context, but do not establish current coverage. |
| 1–2   | A narrow presence check or incidental exercised entry; no complete user outcome.                                                                                                          |
| 3–4   | A partial happy path, with important outcomes or stable checks missing.                                                                                                                   |
| 5     | A basic complete happy path with meaningful outcome verification.                                                                                                                         |
| 6–7   | Happy path and several important variants or recovery intents, with named material gaps.                                                                                                  |
| 8–9   | Broad coverage of important intents and major variants, with substantial stable checks and limited named gaps.                                                                            |
| 10    | Ideal coverage of important intents, major variants and all meaningful stable checks; no meaningful gap identified. Exhaustive edge cases are not required.                               |

An unavailable-platform score remains 0 with `applicability = not-supported`, unless an applicable test verifies the unsupported-state intent. This is distinguishable from a supported feature with missing tests. A score of 0 can retain an inactive or stale source reference: it does not mean that a keyword never appears anywhere in the repository.

High-level capabilities are assessed against their own meaningful user intents. They do not automatically inherit the best child score or average every leaf. An ancestor scenario is not copied to every descendant. A test reaching a Send form, for example, does not establish coin-control, fee, CSV-import and locktime coverage unless those controls and their relevant outcomes are actually exercised and checked.

## Review method

Reviewers inspect scenario bodies, expected results, invoked assertion helpers and platform/project selection. [source-audit.json](../source-audit.json), titles and feature mappings are discovery aids, not scoring evidence by themselves. The three disjoint review scopes cover the complete catalog: administration, wallet, and trading/earn/connect services.

Automated `skip`, conditional exclusions and iOS-only tags are considered. In contrast, `describe.skip('Manual', ...)` is the repository convention for storing written manual procedures, not evidence that those procedures are invalid. Their `steps` and expected checks are assessed; a placeholder such as “No manual steps” does not earn happy-path credit. Procedures that no longer match the exposed application are explicitly qualified.

Mocks and fixtures can support strong, stable E2E verification. The review asks whether they bypass the feature being scored: preloading accounts is valid setup for testing Send, but is not evidence for account import. A simulated event can verify notification filtering without proving blockchain-to-notification integration. Shared Connect SDK signing checks do not automatically prove WalletConnect pairing, proposals or sessions.

Every score includes confidence, applicability, a rationale, covered intents, important gaps, and line-based test evidence. Confidence describes the strength of the source judgment, independently from the score. No application unit/E2E suites were executed for this assessment.

## Files and maintenance

- [Complete score spreadsheet](../test-coverage.csv): four numeric scores, confidence, applicability, rationale, intents, gaps and evidence for every feature.
- [Canonical dataset](../features.json): full assessments in each feature's `test_coverage` object.
- [Audit manifest](./audit.json): scope, partition and reviewed-source fingerprints, rubric and completeness counts.
- [Scoring contract](./contract.json): machine-readable rubric and authoring format.
- [Reviewed source snapshot](./reviewed-sources.json): exact fingerprints of reviewed tests, procedures, helpers and selection configuration; changed sources require a new review.
- [Administration review](./assessment-administration.json), [wallet review](./assessment-wallet.json), [services review](./assessment-services.json): source assessments.

The [pre-assessment baseline](./baseline.json) preserves all existing feature fields and every current screenshot. Its hashes exclude `test_coverage` and the derived tree fields `runtime_order` and `current_is_leaf`, so appending a reviewed feature does not count as changing existing ones. Both this baseline and [runtime/baseline.json](../runtime/baseline.json) also ignore the derived `local_link` (repository-relative `path:line`) and `github_url` (published Git base) fields, so the build verifies the same way in any checkout. Missing assessments fail the build; they are never silently filled with zero. Reviewed test-source fingerprints must remain current. Re-review affected features after changing scenarios, assertion helpers or execution selection; record source changes and regenerate the exports with `build.ts`. Run `verify.ts`, JSON Schema, the offline-viewer checks and formatting before publishing updated ratings.
