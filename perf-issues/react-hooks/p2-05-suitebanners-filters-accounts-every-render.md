Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Relocate render-body work before memoizing it, and memoize only what pays"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/components/suite/banners/SuiteBanners/SuiteBanners.tsx:119`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/banners/SuiteBanners/SuiteBanners.tsx#L119)

Rendered on effectively every page via
[`SuiteLayout.tsx:135`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/layouts/SuiteLayout/SuiteLayout.tsx#L135)
(also mounted from `ConnectAppBar.tsx`, `WelcomeLayoutWithoutModalSwitcher.tsx`, and
`OnboardingLayout.tsx`).

## Before

```tsx
const device = useSelector(selectSelectedDevice);
const isOnline = useSelector(state => state.suite.online);
const bannerMessage = useSelector(selectBannerMessage);
const firmwareRevisionError = useSelector(selectFirmwareRevisionCheckErrorIfEnabled);
const firmwareHashError = useSelector(selectFirmwareHashCheckErrorIfEnabled);
const isDeviceBackupUnfinished = useSelector(selectIsDeviceBackupUnfinished);
const isDeviceBackupRequired = useSelector(selectIsDeviceBackupRequired);
const transport = useSelector(state => state.suite.transport);
const accounts = useSelector(selectVisibleDeviceAccounts);
// ...
} else if (accounts.some(account => isCardanoStakedWithFiveBinaries(account))) {
    banner = <CardanoOutdatedStakingBanner />;
    priority = 20;
}
```

## After

```tsx
const hasCardanoAccountStakedWithFiveBinaries = useMemo(
    () => accounts.some(isCardanoStakedWithFiveBinaries),
    [accounts],
);
// ...
} else if (hasCardanoAccountStakedWithFiveBinaries) {
    banner = <CardanoOutdatedStakingBanner />;
    priority = 20;
}
```

## Why it matters

`SuiteBanners` is mounted on essentially every screen and subscribes to `device` and
`state.suite.transport` alongside ~9 other selectors — both device polling and transport status are
among the most frequently-updated slices in this app. As written, every one of those ticks re-runs
`accounts.some(isCardanoStakedWithFiveBinaries)` from scratch even though neither `device` nor
`transport` has anything to do with the account list. `.some()` short-circuits on the first match, but
for a user with no affected Cardano account it still walks every enabled account, every time, purely
because an unrelated selector changed reference.

## Notes

- `useMemo` needs importing — `SuiteBanners.tsx` currently imports only `useEffect, useState` from
  `react`.
- In-repo precedent for pushing this further into a memoized selector, if preferred over a local
  `useMemo`:
  `suite-native/staking/src/cardanoStakingSelectors.ts:89-94`'s
  `selectFirstCardanoAccountStakedWithFiveBinaries` already does the equivalent scan
  (`accounts.find(account => account.visible && isCardanoStakedWithFiveBinaries(account))`) as a
  `createMemoizedSelector` over `selectDeviceAccounts`. A `packages/suite`/`suite-common` sibling built
  the same way (`createWeakMapSelector` over `selectVisibleDeviceAccounts`) would fix this at the
  source rather than per-consumer, but isn't required for this specific finding — the local `useMemo`
  above is the minimal fix for the one call site the scan found.
- Confidence on this finding is medium on real-world severity (the scan didn't measure `SuiteBanners`'s
  actual re-render rate); the fix itself is a pure, low-risk win regardless.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
