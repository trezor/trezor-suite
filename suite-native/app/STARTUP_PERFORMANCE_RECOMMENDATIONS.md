# Suite Native startup performance recommendations

## Purpose

This is a working document for improving the time between launching Suite Native and seeing a usable
Home screen. The intended outcome is a faster perceived startup without allowing features to call
Connect or blockchain functionality before their prerequisites are ready.

Reasonable transitional UX is acceptable: the application shell and cached portfolio may be visible
while individual actions remain disabled or show a loading state.

## Existing branch result before the post-mount experiment

The main improvement on the current branch is that rendering no longer waits for
`postOnboardingInitThunk` to finish Connect and blockchain initialization. The application shell is
released by `applicationInitThunk.fulfilled`, while post-onboarding initialization continues in the
background.

The earlier Android/Metro sample measured:

| Revision   |             Mean time to visible Home |
| ---------- | ------------------------------------: |
| Before     |                              4,032 ms |
| After      |                              3,346 ms |
| Difference | **686 ms faster (approximately 17%)** |

These results are promising, but they are not a final benchmark. Metro, process state, network state,
device temperature, persisted data and caching can all produce large variance. A release APK using the
develop environment should be used for the final comparison.

## Current retained startup model

```text
Register React root
    |
    +-- hydrate persisted Redux state
    +-- load network modules
    +-- applicationInitThunk
            +-- prepare cached environment data (awaited)
            +-- configure analytics, message system and selected device
            +-- launch postOnboardingInitThunk (not awaited)
                    +-- initialize Connect (awaited)
                    +-- initialize blockchain (awaited)
                    +-- launch token definitions, staking, fiat rates and WalletConnect
            +-- fulfilled -> isAppInitialized = true
                                |
                                +-- render navigation/Home
                                +-- hide native splash
```

`isAppInitialized` and `appServicesInitializationStatus` represent different facts:

- `isAppInitialized`: persisted state and minimum application bootstrap are ready, so the React shell
  can render.
- `appServicesInitializationStatus`: Connect and related application-service initialization state.

An equivalent app-shell readiness signal remains necessary. It should not be derived from
`postOnboardingInitThunk.pending`, because that thunk is not dispatched for users who are still in
onboarding.

## Recommended work

### P0: Correctness and failure handling

#### 1. Replace the broad service-ready selector with capability-specific readiness

`selectCanUseAppServices` currently treats `Error` as usable. That is unsafe once known initialization
errors reject the thunk. It also hides an important distinction:

- If Connect fails, Connect and blockchain functionality are unavailable.
- If Connect succeeds but blockchain initialization fails, device-oriented Connect calls may work,
  while blockchain calls do not.

Short-term safe behavior is to return `false` for `Error`. The better model is to expose capabilities,
for example:

```text
selectCanUseTrezorConnect
selectCanUseBlockchain
selectCanUseWalletConnect
```

Consumers should depend on the narrowest capability they need. This prevents a single aggregate flag
from gradually becoming an inaccurate global switch.

Drawbacks:

- More state or selectors are required.
- Call sites must be audited and migrated.
- Partial initialization needs deliberate UX rather than one global loading state.

#### 2. Do not initialize blockchain after Connect fails

`initBlockchainThunk` uses `TrezorConnect.blockchain*` and should only run after Connect succeeds. The
current implementation catches a Connect failure and then attempts blockchain initialization anyway,
which may create a second, derivative error.

The dependency graph should be explicit:

```text
Connect -> blockchain -> blockchain-dependent features
```

Independent work such as token definitions and staking may still be scheduled separately. Fiat-rate
and WalletConnect behavior should be checked at the actual call sites before being classified as
independent, because parts of their later workflows use Connect.

Drawbacks:

- This changes degraded-startup behavior and therefore needs focused regression coverage.
- The application needs a retry path if initialization fails transiently.

#### 3. Handle `applicationInitThunk.rejected`

`isAppInitialized` is currently set only by `applicationInitThunk.fulfilled`. If minimum bootstrap
fails, the application may stay behind the native splash indefinitely. The bootstrap also awaits Redux
Toolkit's dispatch result without calling `.unwrap()`, so rejection is not handled as an exception by
the caller.

Introduce an explicit startup failure outcome and show a recoverable error/restart screen, or define a
safe degraded state in which the shell may still render. The native splash must never be the permanent
failure UI.

Drawbacks:

- A new failure UX may be required.
- Storage failures already have separate alert behavior and should not result in duplicate messages.

#### 4. Make post-onboarding initialization idempotent

The thunk can be dispatched during startup and when onboarding exits. Add a thunk `condition` or an
equivalent guard so concurrent calls cannot register duplicate Connect listeners, initialize the same
SDK twice, or create overlapping periodic work.

The expected behavior for a later retry from `Error` should be explicitly allowed.

#### 5. Normalize startup error reporting

Avoid `JSON.stringify(error)` in `console.error`:

- `Error` commonly serializes to `{}`.
- Circular values can make stringification throw.
- Error-level console output may be captured remotely, so unknown objects should not be forwarded
  without controlling their contents.

Prefer a deliberately safe stage and known error code/message. Do not include device, account, address,
transaction, balance, session or request data.

### P1: Likely performance improvements

#### 6. Start post-onboarding initialization after the first visible frame

Not awaiting the thunk removes its asynchronous duration from the render gate, but its synchronous
setup and promise continuations can still compete with the first Home render on the JavaScript thread.

A stronger sequence is:

```text
hydrate -> minimum app setup -> commit visible Home -> start post-onboarding initialization
```

Use a deliberate first-frame/Home-layout signal rather than relying on thunk dispatch ordering. Avoid
moving all orchestration into a screen component; a small startup coordinator can receive the visible
signal and start background initialization.

Expected benefit:

- More deterministic time to visible Home.
- Less contention and fewer dropped frames during the first render.

Drawbacks:

- Device and blockchain functionality becomes available slightly later.
- Controls that need those capabilities must show a short loading or disabled state.
- Waiting for all React Native interactions may be excessive; measure a one-frame or first-layout
  deferral separately.

The first debug/simulator experiment did not improve time to visible Home. It successfully moved
Connect and blockchain initialization after the frame marker, but the remaining initial
React/navigation work was still slow and highly variable. Keep this as a release-build experiment,
not as a demonstrated optimization.

#### 7. Split the initial Home render into a lightweight shell and deferred content

The current splash effect runs only after React commits the complete initial subtree. For a populated
portfolio, that subtree includes the Skia graph, banners and alerts, animated containers, and a legacy
asset list that renders every network immediately.

Experiment with committing a recognizable Home shell first: navigation, header, cached balance and
stable placeholders for the graph and asset content. Use an explicit Home layout/presentation signal
to hide the splash, then mount expensive content in separate steps after that signal.

Measure these pieces independently:

- Graph and graph gesture/Skia components.
- Legacy `AssetList`, including its per-network selectors and animations.
- Promo banners and Home alerts.
- Initial Reanimated layout transitions.

Expected benefit:

- Directly reduces the work that must finish before the user sees Home.
- Preserves the layout while progressively enabling useful cached content.

Drawbacks:

- The user may briefly see placeholders or content appear progressively.
- Deferring content must not delay accessibility focus or cause large layout shifts.
- A frame callback alone is insufficient; one experiment briefly exposed a blank surface after the
  splash was hidden.

If the legacy asset list is a significant contributor, virtualize it rather than mapping every asset
at mount. If the graph dominates, preserve its dimensions but mount the actual graph after the shell
is visible.

#### 8. Lazily evaluate noninitial navigation screens

`src/navigation/RootStackNavigator.tsx` imports a large number of secondary screens and flows. The tab
navigator also eagerly references every tab module. React Navigation delays mounting inactive screens,
but importing and reading their component bindings may still force module evaluation during initial
navigation construction.

The root navigator currently registers 60 screens and references 19 feature-module packages. The
Storybook route is a particularly useful first experiment: non-production Metro builds enable
Storybook, and evaluating `StorybookUI` starts Storybook during application startup even when the route
is never opened. Lazy-loading that route would improve develop-environment measurements without
affecting normal navigation behavior.

Experiment with React Navigation's `getComponent` and statically analyzable `require()` calls. Keep the
initial Home route eager and defer likely expensive, uncommon destinations such as:

- Trading flows
- Earn transaction flows
- Settings subflows
- Developer utilities
- Secondary device and modal flows

Expected benefit:

- Less JavaScript module evaluation before Home becomes visible.
- A smaller amount of work during initial navigation construction.

Drawbacks:

- The first navigation to a deferred flow may be slightly slower.
- Deferred modules may expose circular-import or initialization assumptions later instead of at boot.
- This should be introduced by feature group, not as one large rewrite.

#### 9. Warm the SecureStore encryption-key read earlier

Redux hydration cannot access encrypted MMKV until the encryption key has been read from SecureStore.
`createEnsureEncryptionKey` already caches its promise, so starting that promise during composition
could overlap native SecureStore work with Redux store, module and provider construction.

Expected benefit:

- Potentially removes part of SecureStore latency from the serial hydration path.

Drawbacks:

- Storage-error alerts must not fire before the React/native UI is able to present them safely.
- The gain may be small on devices where SecureStore is already fast.

Measure encryption-key start/end separately before and after the change.

#### 10. Replace the web-oriented cached environment lookup on native

`prepareCachedEnvData()` is the only awaited operation inside `applicationInitThunk`. Its implementation
documents that the asynchronous OS-version lookup is required for web/desktop and is also called on
mobile for a consistent interface.

Investigate a platform adapter that supplies React Native's OS information directly, potentially using
`Platform.Version` synchronously. Validate all mobile message-system OS conditions before removing or
changing the await.

Expected benefit:

- Removes avoidable work from the minimum-bootstrap critical path.
- Makes the source of native environment information explicit.

Drawbacks:

- OS-version formatting must stay compatible with message-system semver comparisons.
- Incorrect platform data could change which messages or killswitches match.

### P2: Measure before changing

#### 11. Profile persisted-state hydration

Hydration includes SecureStore access, encrypted MMKV initialization, persisted reducer reads,
migrations, transforms and JSON parsing. Record the total hydration duration and, locally, the cost and
size of individual persisted keys.

If hydration dominates startup, consider:

- Reducing accidentally persisted or oversized data.
- Optimizing expensive transforms or migrations.
- Hydrating only routing/theme/locale/bootstrap state before rendering and deferring heavy wallet data.

Two-phase hydration is intentionally not the first recommendation. Home benefits from cached accounts,
transactions and graph data, and writing to a slice before its deferred state is restored can overwrite
persisted data.

#### 12. Profile application composition and initial module evaluation

The current JavaScript startup metric begins after entry-module evaluation. It therefore does not
describe the complete user-perceived duration from tapping the icon. Add local marks around composition,
store construction and root registration, and compare them with Android process/activity launch timing.

This data should decide whether further work belongs in Redux initialization, navigation imports, the
composition root or native startup.

## Recommended module shape

Keep three concepts separate:

```text
Application bootstrap
    Produces: app shell may render, or a bootstrap failure is shown

First-visible-frame coordination
    Produces: native splash is hidden and background initialization may begin

Post-onboarding initialization
    Produces: explicit Connect/blockchain capabilities or an actionable failure
```

`applicationInitThunk` dispatches `postOnboardingInitThunk` without awaiting it, which forces its state
and extra dependency types to include all downstream initialization dependencies. A future startup
coordinator could separate that orchestration from both the bootstrap thunk and the React tree:

- `applicationInitThunk`: only minimum application setup.
- `postOnboardingInitThunk`: only post-onboarding Connect/background setup.
- Coordinator: ordering, first-frame scheduling and retry policy.

Keep `PostOnboardingInitializationResult` as the explicit fulfilled payload type. `Disabled` is a valid
business outcome, while initialization errors are rejected outcomes. `Idle` remains useful as the state
before post-onboarding initialization has been requested.

## Post-mount initialization experiment (not retained)

The experiment narrowed pre-mount work to the minimum application bootstrap:

```text
Before mount
    hydrate Redux
    load network modules and cached environment data
    start message-system initialization without awaiting its remote refresh
    select the persisted device or create the Portfolio Tracker device
    fulfill applicationInitThunk -> render the application shell

After two animation frames following the root commit
    dispatch postOnboardingInitThunk
    initialize Connect
    initialize blockchain after Connect succeeds
    start token definitions, staking, fiat rates and WalletConnect
```

The post-mount coordinator uses two animation-frame callbacks. The intention is to allow the committed
native tree to be presented before the second callback starts background initialization. As the
measurements below show, an animation-frame callback does not prove that useful native content is
visible. This is an experiment to isolate JavaScript-thread contention, not a substitute for readiness
protection.

Because the experiment did not demonstrate a visible-Home improvement and introduced a service
readiness race, it was removed. The retained implementation dispatches `postOnboardingInitThunk`
without awaiting it from `applicationInitThunk`.

The pre-experiment development-build trace was:

| Marker                                            | Time from JavaScript startup |
| ------------------------------------------------- | ---------------------------: |
| `applicationInitThunk.fulfilled`                  |                     1,107 ms |
| First initialized `AppComponent` render           |                     2,140 ms |
| Root navigation committed                         |                     3,898 ms |
| Splash hide fulfilled                             |                     4,143 ms |
| First animation frame after the navigation commit |                     4,647 ms |
| Connect and blockchain initialization fulfilled   |                     5,364 ms |

The significant interval is the approximately 2,791 ms between minimum application initialization and
the root-navigation commit. A before/after comparison must determine how much of this is initial React
work and how much is contention from post-onboarding initialization.

### First post-mount experiment result

The device log contains five complete instrumented development-build startup traces before the
scheduling change and four complete traces after it. The sample mixes Metro reloads and process
relaunches, which limits direct comparison. Two of the post-change samples were fresh process
relaunches driven through `agent-device` on the iOS simulator; `agent-device` also confirmed that the
Home screen was eventually present after those measured launches.

| Marker                                  | Before, median (range) | Post-mount experiment, median (range) |
| --------------------------------------- | ---------------------: | ------------------------------------: |
| `applicationInitThunk.fulfilled`        | 1,155 ms (1,076-1,782) |                1,783 ms (1,579-2,171) |
| First initialized `AppComponent` render | 2,323 ms (2,005-4,041) |                2,742 ms (1,731-3,805) |
| Root navigation committed               | 4,440 ms (3,884-8,599) |                6,540 ms (3,657-7,262) |
| Splash hide fulfilled                   | 4,659 ms (4,110-9,027) |                6,962 ms (3,870-7,672) |
| `postOnboardingInitThunk` dispatched    | approximately 1,034 ms |                approximately 7,927 ms |

The splash-hide arithmetic mean changed from 6,150 ms to 6,366 ms. The medians look substantially
worse, but both sets are bimodal and have wide ranges, so this development-build sample is not stable
enough to claim a 2.3-second regression. It does show that the experiment produced **no measured Home
screen improvement**. Connect and blockchain work was successfully moved past the first-frame marker,
but initial React/navigation work continued to dominate the path to a visible Home screen.

Two details are especially useful:

- Waiting for the message-system/killswitch result before mounting moved the median
  `applicationInitThunk.fulfilled` marker approximately 628 ms later. This also changed the critical
  path while testing deferred Connect initialization, so the experiment did not isolate one variable.
  The await has been removed: hydrated message-system state remains available immediately, while its
  remote refresh continues without delaying the application shell.
- The median interval from `applicationInitThunk.fulfilled` to the first initialized render improved
  only from approximately 1,168 ms to 959 ms. The much larger and highly variable render-to-navigation
  interval remained even while Connect was not running, which weakens the hypothesis that Connect is
  the main source of startup contention.

One experiment run briefly exposed a blank surface after the splash was hidden before Home became
observable. A committed React tree and an animation-frame callback therefore should not be treated as
proof that useful native content has been presented. If post-mount initialization is pursued, its
trigger should be tied to an explicit Home/shell layout or presentation signal and measured in a
release-like build on a physical Android device before being considered safe.

### Protecting Connect calls during deferred initialization

`requestPrioritizedDeviceAccess` is a device-operation mutex. It does not check Connect readiness, wait
for `connectInitThunk`, or propagate an initialization failure. Connect initialization also does not
currently acquire this mutex, so merely wrapping a caller does not prevent it from running before
`TrezorConnect.init` finishes.

Two possible designs were considered:

1. **Acquire the device mutex during Connect initialization.** Device calls using the same mutex would
   queue until initialization releases it. This is mechanically simple, but conflates SDK readiness
   with exclusive hardware access, holds keep-awake during initialization, does not cover blockchain
   calls or unwrapped Connect calls, and cannot safely communicate initialization failure to queued
   callers. Initialization-triggered device work could also create deadlocks.
2. **Add a single-flight readiness gate such as `ensureConnectInitialized`.** A completed initialization
   returns immediately, an in-progress initialization shares its existing promise, an idle state starts
   initialization, and a disabled or failed state returns a typed failure. Device commands then cross
   the readiness seam before acquiring the existing mutex:

    ```text
    ensure Connect is ready -> acquire device mutex -> execute device command
    ensure blockchain is ready -> execute blockchain command
    ```

The readiness gate is the preferred long-term module because it keeps the readiness and exclusivity
interfaces separate, gives callers an actionable failure and centralizes retry policy. Capability
selectors are still needed for UX, but they are not a correctness seam: stale UI and background hooks
can otherwise race initialization.

Until a readiness gate exists, the post-mount scheduling experiment is not production-safe without an
audit of automatic hooks and user actions that can invoke Connect or blockchain functionality.

## Measurement plan

### Primary metric

Measure time from a cold application launch until the Home screen is visibly committed. Do not use
Connect or blockchain readiness as the primary startup metric.

Add distinct marks for:

1. Earliest native/process launch timestamp available.
2. JavaScript entry reached.
3. Composition root completed.
4. Redux hydration started and completed.
5. Network modules loaded.
6. Minimum application initialization completed.
7. First Home layout/visible commit.
8. Native splash hide completed.
9. Connect initialization completed.
10. Blockchain initialization completed.

Keep shell-visible and service-ready measurements separate. The first tells us what the user sees; the
second tells us how long controls may need transitional loading states.

### Benchmark build

Use release APKs configured with `EXPO_PUBLIC_ENVIRONMENT=develop`. This removes Metro/dev-client noise
while preserving the develop backend environment. Do not provide or use a Sentry authentication token
for the local build.

### Benchmark procedure

- Use the same physical Android device, OS version and power mode.
- Keep persisted state equivalent between revisions.
- Force-stop the process before each cold-start sample without clearing application data.
- Control whether the Trezor is connected and keep that scenario consistent.
- Keep network conditions consistent; consider separate online and offline runs.
- Avoid measuring while the phone is thermally throttled or installing/building in the background.
- Collect at least 15-20 runs per revision.
- Compare median, p75 and spread; do not rely only on the mean or a single best run.
- Alternate or otherwise balance revision order so thermal state and caches do not favor one build.

Recommended scenarios:

| Scenario                                         | Purpose                                                                |
| ------------------------------------------------ | ---------------------------------------------------------------------- |
| Onboarded, cached portfolio, no connected device | Primary Home-startup comparison                                        |
| Onboarded, physical device connected             | Connect/device competition with first render                           |
| Onboarded, offline                               | Failure/degraded-startup behavior                                      |
| Fresh installation/onboarding                    | Verify that app-shell readiness is independent of post-onboarding init |

### Automation

The physical-device loop can largely be automated:

1. Force-stop the application.
2. Clear previous local measurement logs, but not application data.
3. Launch the application.
4. Wait for a stable Home accessibility identifier or an explicit `homeVisible` log marker.
5. Collect phase timestamps and a screenshot/snapshot as evidence.
6. Repeat and summarize the distribution.

Agent-device is suitable for launch/UI confirmation and collecting visual evidence. Explicit in-app
performance markers are preferable for millisecond timing; screenshot polling alone includes automation
latency and should be treated as a secondary end-to-end check.

No confidential device or account values should be included in performance marks, logs, Sentry tags or
measurement exports.

## Test recommendations

### Unit tests

Cover the orchestration and state transitions, not only reducer cases:

- Killswitch returns `Disabled` and starts no blocked services.
- Successful Connect and blockchain initialization fulfills with `Ready`.
- Connect failure rejects with `Error` and does not attempt blockchain initialization.
- Blockchain failure rejects with `Error` and exposes only capabilities known to be safe.
- Unexpected exceptions reject and leave a recoverable state.
- A concurrent dispatch is ignored while initialization is already in progress.
- A retry from `Error` is allowed and can reach `Ready`.
- Unfinished onboarding skips post-onboarding initialization while still making the app shell ready.
- `applicationInitThunk` failure cannot leave the application permanently behind the splash.

Use deferred promises in the thunk tests to prove that `isAppInitialized` becomes true without waiting
for Connect/blockchain completion.

### Automated device tests

Add or extend an Android end-to-end scenario with deliberately delayed mocked Connect initialization:

- Home appears while post-onboarding initialization is still pending.
- Cached, safe content is visible.
- Connect/blockchain-dependent actions are disabled or show a loading state.
- Actions become available when initialization succeeds.
- Failure produces recoverable UX rather than a crash or permanent spinner.

## Suggested implementation slices

Keep changes reviewable and measurements attributable:

1. **Failure semantics:** reject known post-onboarding errors, update gating and add focused tests.
2. **Dependency ordering:** short-circuit blockchain after Connect failure and define retry behavior.
3. **Instrumentation only:** add phase and Home-visible measurements without changing scheduling.
4. **First-frame scheduling:** start post-onboarding work after the visible Home signal and remeasure.
5. **Navigation experiment:** defer one heavy feature group, measure, then expand only if beneficial.
6. **Storage/environment experiments:** warm SecureStore and replace native environment lookup in
   separate commits so each result is measurable.

## Approaches not recommended currently

- Setting `isAppInitialized` from `postOnboardingInitThunk.pending`: onboarding users never dispatch
  that thunk, and the two readiness concepts would become coupled.
- Removing `isAppInitialized` without an equivalent hydration/bootstrap-ready signal.
- Continuing to treat every `Error` state as permission to use all application services.
- Performing a two-phase persistence redesign without measurements showing hydration is a dominant
  cost.
- Bundling instrumentation, scheduling changes, navigation changes and persistence changes into one
  commit, because the performance effect and regressions would be difficult to attribute.
