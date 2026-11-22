# Trezor Suite user feature map

An English inventory of user capabilities across Suite desktop, web and native mobile, from device onboarding and wallet actions to individual form options and settings. The source snapshot was audited at commit `8d6be9edbf990465176d57b4abc007bac17ca5e6` on 15 November 2026 and moved to `develop` at `cc9f201eaa7d2e1212624d4f1e565dce3f727060` on 21 November 2026: renamed and deleted sources, changed tests and features added on `develop` since then were reviewed. Runtime captures keep the commits they were taken from.

> Current totals live in [summary.json](./summary.json); runtime captures and model findings are in the [runtime audit](./runtime/README.md) and [offline explorer](./explorer.html).

Each feature also includes four **0–10 test-quality scores**: desktop automated E2E, Android automated E2E, desktop manual and Android manual. The [scoring method](./test-coverage/README.md) defines the scale and evidence rules. See scores with rationale, gaps and test links in the explorer, or import the [complete score spreadsheet](./test-coverage.csv). These ratings assess written test verification; they are independent from the runtime walkthrough and do not claim test execution or pass rates.

The current catalog contains **627 nodes in 22 areas**, including **528 leaves** (569 nodes from the initial source baseline, 9 from the runtime audit, 18 from the [screen-by-screen source audit](./screen-audit/README.md), and 31 from later source additions in [source-additions.json](./parts/source-additions.json)). It reconciles 854 source-inventory records through 228 explicit platform equivalences. Every node includes a description, platform availability, user navigation, conditions, ownership evidence and implementation references.

The [screen-by-screen source audit](./screen-audit/README.md) accounts for all **51 desktop page files** and **217 native `*Screen.tsx` files**, with helpers and inspection limits explicitly distinguished, and adds a [route coverage](./screen-audit/route-coverage.md) check across mobile and desktop/web routes.

## Open or render the map

| File                                        | Purpose                                                                                                                                                                                                  |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Offline explorer](./explorer.html)         | Interactive map: expandable tree with screenshot thumbnails, coverage overview and landscape, screenshot gallery, sortable table, cross-links and filters. Open the file locally; no server is required. |
| [Compact outline](./overview.html)          | Expand the user-facing tree with desktop/web/mobile status; suitable for an inline overview.                                                                                                             |
| [Canonical JSON](./features.json)           | Authoritative structured dataset, including platform variants, source identities and containment/related edges.                                                                                          |
| [Feature CSV](./features.csv)               | Spreadsheet or database import, one canonical node per row. Nested evidence and platform ownership are JSON cells.                                                                                       |
| [Edge CSV](./edges.csv)                     | `source,target,type` edges for graph and diagram tools.                                                                                                                                                  |
| [GraphML](./feature-map.graphml)            | Hierarchical graph with descriptions, platforms, teams and component links; includes containment edges.                                                                                                  |
| [Plain text hierarchy](./feature-tree.txt)  | Complete readable outline with stable IDs.                                                                                                                                                               |
| [Source audit](./source-audit.json)         | E2E/manual scenario dispositions, desktop routes, and enumerated screen-subtree/navigation files.                                                                                                        |
| [Schema](./schema.json)                     | JSON Schema 2020-12 for the canonical dataset.                                                                                                                                                           |
| [Platform equivalences](./equivalences.csv) | Native source IDs reconciled into canonical IDs.                                                                                                                                                         |
| [Summary](./summary.json)                   | Machine-readable counts and remaining uncertainty.                                                                                                                                                       |
| [Verification record](./verification.json)  | Executed artifact checks and concrete environment limitations.                                                                                                                                           |
| [Runtime coverage](./runtime-coverage.csv)  | Per-feature desktop/web/mobile observation status and current screenshot paths; source availability remains separate.                                                                                    |

Use `id` as the renderer key and `parent_id` or `contains` edges for the hierarchy. Start with `parent_id = null`, then expand by `depth`. Use `related` edges as optional cross-links, not as additional parents. The dotted ID namespace does not determine ancestry: the explicit parent does. Internal prototype references are labeled `scope = internal-reference`; the explorer always shows them with an _internal_ tag.

For a readable complete diagram, show areas first, expand a selected branch and reveal metadata on selection. A single fully expanded canvas would obscure individual controls. Platform and team filters should preserve ancestor context. Keep uncertainty, rollout conditions and historical-image labels visible.

## Using the explorer

Open [explorer.html](./explorer.html) in a browser. It embeds the data, loads screenshots from `runtime/screenshots` and needs no network access.

Test coverage is hidden by default to keep the views simple. The **E2E coverage** switch in the toolbar shows it in every view: the scores (automated E2E and manual), subtree distributions, the coverage overview and landscape, score colours on the map, the detail panel's coverage and test references, the _Shared test_ connections and the score columns in the CSV export. The switch is kept in the URL (`cov=1`). The descriptions below assume it is on.

- **Tree** shows the hierarchy. Each row has platform availability, four coverage scores, a subtree score distribution, connection count and screenshot thumbnails. Filtering keeps non-matching ancestors as dimmed context and expands branches with matches.
- **Overview** shows mean scores and score distributions per coverage axis, an area table, and a landscape with one tile per feature, colored by a selected axis.
- **Screens** lists runtime screenshots for the filtered features, grouped by area. Each screenshot links to the features it shows. When a mobile screen was captured on several iPhone simulators, _iPhone model_ in the Display filters picks the capture shown in every view (iPhone 18 Pro by default), falling back to another model where the chosen one has no capture. The screenshot viewer switches models for the open screen.
- **Table** is a flat, sortable list. Export CSV downloads the current filtered rows.
- **Map** draws the same hierarchy as a mind map on a canvas, with areas branching left and right of the centre. Drag to pan, scroll or pinch to zoom, and use the zoom bar to fit the map or centre the selection. Click a node to select it and click it again, or use its round button, to expand or collapse it. It shares expansion and filters with the tree. Each node shows availability, the four scores and thumbnails; its stripe, and the whole node when zoomed out, shows the score of the axis chosen in _Colour by_. The selected feature's connections are drawn as coloured curves; a dashed curve points to a collapsed branch with connections inside. _All_ draws every connection between visible features. The corner overview shows the current viewport; click or drag in it to move.
- The **detail panel** shows navigation and conditions per platform, scores with rationale, covered intents, gaps and test evidence, screenshots, sub-features, root components, ownership and evidence.
- Its **connections** section has a graph and lists of four link types:
    - explicit related features;
    - features visible on the same screenshot, using the errata-corrected scope;
    - features sharing a dedicated root component;
    - features whose non-zero scores cite the same active test scenario.

    Pairs with an ancestor/descendant relation, groups larger than 12 features, and component or test links between siblings or through a container inherited from an ancestor are omitted. _Filter to connections_ limits every view to the selected feature and its connections.

- **Filters:** show or hide desktop, web and mobile from the status bar or the filter panel; this also hides their columns, screenshots, connections derived from their screenshots, and coverage axes. Features are listed when they are available, including conditionally, on at least one shown platform. Each feature has one frontend team and one backend team, the same for all platforms; the team filter matches either, and the tree shows `frontend / backend` where they differ. Teams come from [team-ownership.json](./parts/team-ownership.json) (see Rebuild and maintain).
- The URL hash stores the view, filters and selected feature, so a view can be bookmarked; Back and Forward move between views and selections. The tree and map support keyboard navigation with arrow keys, `Home` and `End`; on the map, arrows follow the branch direction and `+`, `-` and `0` zoom in, zoom out and fit. Press `?` for the legend and shortcuts.

## Method and source evidence

The structure follows user goals and activities rather than package directories. [Jeff Patton's story-mapping approach](https://jpattonassociates.com/the-new-backlog/) preserves the relationship between broad activities and the tasks beneath them. Here that becomes area → feature → intent (the `level` values `area`, `feature` and `intent`), such as Send → Fee selection → EVM priority fee. An intent is the smallest independently meaningful thing a user wants to do. Pinned inputs still spell the lowest level `option`; `build.ts` publishes it as `intent`.

[NN/g's journey-mapping guidance](https://www.nngroup.com/articles/journey-mapping-101/) emphasizes an actor, goal and scenario. This inventory uses the Suite user's viewpoint and records where each capability is encountered. It does not infer emotions or usability outcomes from code. [NN/g's mapping-methods guide](https://www.nngroup.com/articles/ux-mapping-methods-study-guide/) informed the separation between the capability hierarchy, navigation and implementation evidence. This is an existing-product capability inventory, rather than a researched emotional journey or delivery backlog.

The audit combines page composition, route and navigator registration, individual controls, device/network checks, experiment flags, manifests, CODEOWNERS, feature documentation and intended test scenarios. Equivalent platform controls share a canonical node when their user outcome matches; distinct contexts and partial combinations retain their own nodes and cross-links. Original platform descriptions and conditions remain in `variants`.

The source audit accounts for **151 manual scenario files**: 148 map to capabilities and three are excluded as internal feature-flag, splash or storage-migration checks. It also accounts for **201 automated E2E files**: 190 map to capabilities and 11 are excluded as instrumentation, infrastructure, performance or hidden diagnostics. All **69 desktop/web routes** are enumerated; debug-only routes are identified separately. A scenario reference describes intended behavior, **not a passing test or a promise that every option is asserted by that scenario**.

Screen-subtree enumeration includes loading states, nested visual helpers and developer screens. `direct-evidence` and `composition-referenced` distinguish a cited implementation from a screen imported by one; `enumerated-only` does not claim that a screen was independently verified or that it adds a missing capability. Route-level mappings provide area context, not runtime reachability proof. These distinctions prevent source counts from being presented as a coverage score.

## Reading a feature record

| Field                                                | Meaning                                                                                                                                                                                                                                                   |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`, `parent_id`, `path_ids`, `breadcrumb`          | Stable identity and canonical user-facing hierarchy.                                                                                                                                                                                                      |
| `name`, `description`, `level`, `depth`              | English capability name, outcome, semantic category and visual nesting.                                                                                                                                                                                   |
| `platforms`                                          | Separate desktop, web and native-mobile availability. A mobile browser belongs to web.                                                                                                                                                                    |
| `navigation`, `navigation_alternatives`              | Primary user entry and other verified entry paths. Technical route patterns live in the source audit.                                                                                                                                                     |
| `conditions_by_platform`, `variants`, `parity_audit` | Platform gates, branch-specific requirements, differences and evidence-backed absence findings. Conditions describe their particular entry/variant; they are not one global conjunction.                                                                  |
| `roots`                                              | Screen entry wrappers and feature/containing components, with symbol and line where identifiable. A shared containing component is not represented as a dedicated leaf-only screen.                                                                       |
| `ownership`                                          | Frontend `team`, `backend_team` (with `backend_basis` when it differs), confidence and reasoning. `agreed` marks an ownership confirmed by team agreement; otherwise functional QA streams are ownership clues.                                           |
| `roots[].codeowners`                                 | Matching CODEOWNERS review assignment, including its pattern and source line. This does not establish accountable product ownership.                                                                                                                      |
| `evidence`                                           | Implementation, route, documentation, automated-test or manual-test references, with the claim each reference supports.                                                                                                                                   |
| `screenshot`                                         | Frozen pre-runtime/historical static-audit screenshot record (`existing-historical` or `not-captured`, preserved by baselines). Current runtime captures live in `screenshots`, `runtime.screenshots` and [runtime-coverage.csv](./runtime-coverage.csv). |
| `source_ids`                                         | Original area/platform records represented by the canonical capability.                                                                                                                                                                                   |

Availability values are deliberately qualified:

- `yes`: the user-facing implementation is exposed in the audited source; ordinary prerequisites still apply.
- `conditional`: a device capability, OS, network, account, provider, firmware, rollout or experimental flag gates the capability.
- `no`: explicitly unsupported or absent from the inspected user-facing composition in this snapshot.
- `unknown`: insufficient evidence for a defensible parity claim.

Local code links are repository-relative `path:line` references, so they never embed a checkout path. GitHub links use the published common ancestor only when the referenced file is unchanged; newer local files retain local/repository links instead of a potentially nonexistent commit permalink. Link existence was checked locally; hosted access was not verified for every source.

## Important platform distinctions

- Native Send has coin control and Bitcoin/EVM custom fee controls, including EIP-1559 fields. Its current form has no Add recipient control. Native custom-fee input excludes Solana and Tron; other network fee-selection behavior remains separately qualified.
- Native ETH and SOL staking support management. ADA and TRX positions are view-only, and their management actions are marked unavailable.
- Device screen brightness, homescreen, rotation, haptics and wipe-code controls are not exposed in the current native settings composition. Desktop/web availability depends on the hardware capability or model.
- Electrum backend selection exists on desktop and native mobile; the web selector excludes it. Native endpoint editing differs from the desktop list.
- Portfolio-tracker account-key/address import is native-only in the audited UI. It is separate from remembering a hardware wallet after disconnecting.
- Application language and device language are separate features. Hardware device names, wallet-instance labels and account labels are also separate.
- Native can display synchronized wallet-instance names but has no wallet-instance rename control. It supports account and hardware-device renaming separately.
- External request review and simulation are shared Connect capabilities, not evidence of WalletConnect pairing. Unsupported methods advertised by compatibility adapters are not treated as functioning features.
- Coinjoin requires qualifying desktop availability; it is not supported on web or native. The internal referral page is a debug-gated mock prototype, distinct from the external referral entry.
- Native standalone Wrap requires developer utilities; eligible standalone Unwrap does not. Supported yield flows can also wrap/unwrap as part of their normal sequence.

## Screenshots and remaining questions

Three visually inspected repository images are linked as **historical**, not current UI verification:

| Capability                    | Historical image                                                          |
| ----------------------------- | ------------------------------------------------------------------------- |
| Initial analytics choice      | [Analytics consent](../onboarding/assets/welcome/data_analytics.png)      |
| Initial firmware installation | [Firmware installation](../onboarding/assets/welcome/firmware_update.png) |
| Transaction history export    | [Export menu with QA testnet data](../transactions/export-button.png)     |

Current runtime evidence adds **251 base application screenshots** (180 web, 13 desktop, 58 native iOS simulator — plus 58 iPhone 18 Pro device re-captures, 309 PNGs total), covering **319 feature nodes** with current captures; see the [runtime audit](./runtime/README.md) and [runtime coverage](./runtime-coverage.csv). All runtime captures use disposable QA fixtures and exclude seed words, PINs, passphrases and real account data. Physical-device flows, Android runtime captures and real-chain/provider execution are not part of this audit.

Six native-platform questions remain `unknown` (along with one desktop and one web entry in [summary.json](./summary.json)), including the distinct bootloader-update sequence, account/token-prefilled Trade entry, the Suite-side account-export selection experience, generic render-error recovery and a continuous Suite Sync connection-status indicator. These are evidence gaps rather than claims of absence. Provider availability, current production rollout and full hardware/OS behavior also require runtime confirmation. Product-team accountability remains provisional until confirmed by the relevant teams.

## Capture flows and landing check

[capture-flows.json](./parts/capture-flows.json) (schema: [capture-flows.schema.json](./capture-flows.schema.json)) records, for each native mobile runtime screenshot, a replayable flow: a start state (`fresh-install`, `keychain-unavailable` or `onboarded-empty`), numbered steps with the route each step lands on, the arrival route with two to five visible landmarks, a status (`draft`, `replayed`, `drifted` or `not-reproducible`) and the replay history. The explorer shows the flow under each mobile screenshot in the feature detail panel.

Steps tap testIDs that are exposed to iOS accessibility (tab bar, header, device switch) or visible English text located by OCR on a fresh screenshot. Most in-screen testIDs cannot be targeted because Suite Native's `Screen` container ([Screen.tsx](../../../suite-native/navigation/src/components/Screen.tsx)) wraps the screen in an `accessible` View, which iOS exposes as one element. Text-located taps keep the source `test_id` for traceability. Icon buttons without text use an offset from a nearby label (`dx`, `dy`, `x_from_right`) or from an exposed element (`right_of`). OCR (tesseract on 3x screenshots) tries sparse-text segmentation, then local Sauvola thresholding for text on coloured buttons, then the default layout; a match must start its row segment and prefers rows without extra words, so `Security` never taps `Privacy & security`.

From the repository root:

```sh
node docs/features/feature-map/capture-flows.ts validate
TESSERACT=/path/to/tesseract node docs/features/feature-map/capture-flows.ts check
node docs/features/feature-map/capture-flows.ts replay --agent-device <cli> [--device <name>] [--start-state fresh-install|keychain-unavailable|onboarded-empty] [--setup] [--update-captures] [ids…]
```

`validate` applies the schema and cross-reference checks (screenshot IDs, routes from `suite-native/navigation/src/routes.ts`, testIDs in native source). `check` OCRs every existing capture of each flow (base capture and device variants) with tesseract (`TESSERACT=` overrides the binary) and writes `runtime/flow-checks.json` with found and missing landmarks per image. `replay` drives the simulator bound to the given agent-device CLI, OCR-checks the arrival screenshot, and updates the flow's `status` and `replays`. Arrival and step screenshots stay in a temporary directory that the command prints; they are not kept in the repository. To refresh the map, add `--update-captures`: the arrival screenshot of each flow that passed replay and landing check replaces that screen's capture for the replay device in [runtime-device-variants.json](./parts/runtime-device-variants.json) and updates its `captured_at`. Update `fixture_context` by hand when the build changed. `--start-state` selects the flows to replay (default `onboarded-empty`); `--setup` first runs that state's setup steps. States with `prepare` are set up outside the app before the replay, on the Mac that hosts the simulator: `bash runtime/flows/prepare-start-state.sh <state> <udid> <TrezorSuiteDebug.app>`. `fresh-install` uninstalls the app, resets the simulator keychain and reinstalls it. `keychain-unavailable` installs a copy whose embedded simulator entitlements are removed, so keychain access fails and the app shows the native "Unable to load app data" storage alert at launch (`mobile-storage-recovery`); run `fresh-install` afterwards to restore the normal build.

## Rebuild and maintain

The area inventories and independent parity/source audits are in [parts](./parts). Their preliminary notes describe those individual investigations; the reconciled `platforms`, conditions and `parity_audit` fields in the canonical dataset take precedence.

From the repository root:

```sh
node docs/features/feature-map/build.ts
node docs/features/feature-map/verify.ts
```

`build.ts` regenerates `explorer.html` through `explorer.ts`. It is not called `index.html` because the documentation book renders this README as the chapter's `index.html`.

[team-ownership.json](./parts/team-ownership.json) assigns every feature a frontend team (Connect, Earn, Growth, Network, Trade or Wallet) for all platforms. The backend team equals the frontend team unless `backend_team_assignments` lists the feature (for example, Connect for direct device communication, or domain-specific backend teams such as Network, Trade or Wallet where backend ownership differs from frontend). `build.ts` maps recorded inventory spellings through `team_aliases`, applies agreed reassignments (`agreed_team_changes`, e.g. Firmware → Growth, and per-feature `feature_teams`) with confidence `agreed`, and fails when a feature ends up without a canonical team. Where the desktop/web and mobile inventories disagreed, the primary desktop/web record wins unless `feature_teams` overrides it. The runtime and test-coverage baselines do not hash ownership, so team changes need no re-pinning.

[source-additions.json](./parts/source-additions.json) holds features added from a later source review, such as the message system (_Service messages_, owned by Growth on frontend and Trade on backend per `team-ownership.json`). They follow the inventory contract, are appended after the runtime additions so existing IDs, order and baseline hashes are unchanged, and need test-quality assessments in their review scope like any other feature.

[runtime-device-variants.json](./parts/runtime-device-variants.json) labels mobile captures with their simulator and adds re-captures of existing screens on other models. Each variant names the capture it re-takes (`variant_of`), its `device`, and a PNG under `runtime/screenshots/`; it shows the same features as that capture. The file is read only by `explorer.ts`: the runtime manifest is pinned by the test-coverage baseline, so variants do not change observations, coverage statistics or verification counts. After changing only `explorer.template.html` or `explorer.ts`, run `node docs/features/feature-map/explorer.ts` to rebuild the explorer from the existing `features.json`.

The scripts are TypeScript that Node 24 runs directly through native type stripping, with no dependencies to install; the local `package.json` only marks them as ES modules. [pylib.ts](./pylib.ts) reproduces the Python-compatible serialisation (JSON, CSV, GraphML, sorting and hashing) that the pinned baselines were created with. The builder reads local Git and source files. It requires `origin/develop` to identify a published reference ancestor, and does not install dependencies or run the application. Formatting is a separate repository check. When adding a capability, retain stable IDs, cite actual UI composition, qualify platform differences and rerun structural/link/schema checks. Regenerate after changing an input inventory; do not hand-edit the canonical exports.
