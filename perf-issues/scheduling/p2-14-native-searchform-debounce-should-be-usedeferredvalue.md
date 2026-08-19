# The native accounts search waits a fixed 200 ms after every keystroke and then commits the whole unvirtualised account list in one uninterruptible pass

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Break a long task up and yield to the main thread"_, its closing rule: for work that is a React render rather than a loop, the lever is `startTransition` or `useDeferredValue`. Unlike the rest of this sweep, the defect here is not a missing guard — `SearchForm` already debounces. It is that a fixed timeout is the wrong primitive for a render: it costs the same 200 ms on a flagship and on a four-year-old Android, it never starts early when the device has room, and the render it eventually triggers is still a single urgent pass that the next keystroke cannot cancel.

## Where

[`suite-native/search/src/components/SearchForm.tsx:35`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/search/src/components/SearchForm.tsx#L35) holds every keystroke in local state and re-arms a 200 ms timer ([`:16`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/search/src/components/SearchForm.tsx#L16)) before calling `onInputChange`. The `SearchInput` it renders is **uncontrolled** — `SearchForm` passes `onChange` but no `value` ([`:67`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/search/src/components/SearchForm.tsx#L67), and `value={value}` at [`SearchInput.tsx:154`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/atoms/src/Input/SearchInput.tsx#L154) receives `undefined`), so the characters themselves are painted by the native `TextInput` and never wait on React. The 200 ms is therefore pure list latency, not keyboard latency.

The expensive consumer is `AccountsListWithFilter`, which stores the query in plain `useState` ([`:46`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/accounts/src/components/AccountsListWithFilter.tsx#L46)), hands `setSearchValue` straight to the header ([`:104`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/accounts/src/components/AccountsListWithFilter.tsx#L104), which renders `SearchForm` at [`SearchableAccountsListHeader.tsx:84`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/accounts/src/components/SearchableAccountsListHeader.tsx#L84)) and passes it down at [`:118`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/accounts/src/components/AccountsListWithFilter.tsx#L118). Every state write there is urgent, so the whole subtree below re-renders in that one task.

The subtree is **not virtualised**. Three nested `map`s, all inside plain `VStack`/`Card`:

- [`AccountsList.tsx:38`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/accounts/src/components/AccountsList/AccountsList.tsx#L38) maps every matching network symbol,
- [`AccountsListNetworkGroup.tsx:41`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/accounts/src/components/AccountsList/AccountsListNetworkGroup.tsx#L41) maps every account type in that network,
- [`AccountsListAccountTypeGroup.tsx:45`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/accounts/src/components/AccountsList/AccountsListAccountTypeGroup.tsx#L45) maps every account of that type.

Each leaf `AccountsListItem` subscribes to four selectors — [`:65`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/accounts/src/components/AccountsList/AccountsListItem.tsx#L65), [`:68`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/accounts/src/components/AccountsList/AccountsListItem.tsx#L68), [`:72`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/accounts/src/components/AccountsList/AccountsListItem.tsx#L72), [`:76`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/accounts/src/components/AccountsList/AccountsListItem.tsx#L76) — and renders four formatter components. Every row mounts: the container is the screen's scroll view, `isScrollable` defaulting to `true` at [`Screen.tsx:92`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/navigation/src/components/Screen.tsx#L92) and resolving to a `KeyboardAwareScrollView` at [`ScreenContentWrapper.tsx:65`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/navigation/src/components/ScreenContentWrapper.tsx#L65). There is no `FlatList` or `FlashList` anywhere on this path.

The empty-state branch reads the same prop ([`AccountsList.tsx:33`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/accounts/src/components/AccountsList/AccountsList.tsx#L33)), which matters below: it stays consistent for free as long as the deferral happens above `AccountsList` rather than inside it.

## Before

`suite-native/search/src/components/SearchForm.tsx:32`–`:43`:

```tsx
const [inputText, setInputText] = useState('');

// Change the input value after a short time of inactivity to prevent unnecessary re-renders while the user types.
useEffect(() => {
    const timeoutId = setTimeout(() => {
        onInputChange(inputText);
    }, KEYBOARD_INACTIVITY_TIMEOUT);

    return () => {
        clearTimeout(timeoutId);
    };
}, [inputText, onInputChange]);
```

with the constant at `:16` and the wiring at `:69`:

```tsx
const KEYBOARD_INACTIVITY_TIMEOUT = 200;
```

```tsx
onChange = { setInputText };
```

and `suite-native/accounts/src/components/AccountsListWithFilter.tsx:118`:

```tsx
searchValue = { searchValue };
```

## After

Three hunks. `SearchForm` stops buffering, and each consumer defers on its own — the hook consumers as well, so removing the debounce does not regress them.

**1. `suite-native/search/src/components/SearchForm.tsx`** — line 1, the deleted constant at `:16`, the body at `:32`–`:43`, and `:69`:

```tsx
import { useEffect } from 'react';
```

```tsx
export const SEARCH_INPUT_ANIMATION_DURATION = 100;
const SEARCH_INPUT_ANIMATION_DELAY = 100;
const MAX_SEARCH_VALUE_LENGTH = 30;
```

```tsx
export const SearchForm = ({ placeholder, onPressCancel, onInputChange }: SearchFormProps) => {
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();

    useEffect(
        () => () => {
            onInputChange('');
        },
        [onInputChange],
    );
```

```tsx
onChange = { onInputChange };
```

**2. `suite-native/accounts/src/components/AccountsListWithFilter.tsx`** — line 1, then `:46` and `:118`:

```tsx
import { type ReactNode, useCallback, useDeferredValue, useEffect, useRef, useState } from 'react';
```

```tsx
const [searchValue, setSearchValue] = useState('');
// The account list below is not virtualised, so it renders at transition priority and React
// can drop a pass that the next keystroke supersedes.
const deferredSearchValue = useDeferredValue(searchValue);
```

```tsx
searchValue = { deferredSearchValue };
```

**3. `suite-native/search/src/hooks/useScreenHeaderSearch.tsx`** — line 1, then the return at `:60`:

```tsx
import {
    type ComponentProps,
    type ReactElement,
    useCallback,
    useDeferredValue,
    useRef,
    useState,
} from 'react';
```

```tsx
return {
    header,
    searchQuery: useDeferredValue(searchQuery),
};
```

## Why it matters

The user has tapped the magnifying glass on the accounts screen ([`AccountsScreen.tsx:47`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-management/src/screens/AccountsScreen.tsx#L47)), or is picking a source account in the send flow ([`SendAccountsScreen.tsx:58`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-send/src/screens/SendAccountsScreen.tsx#L58)) or a destination in receive ([`ReceiveAccountsScreen.tsx:65`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-receive/src/screens/ReceiveAccountsScreen.tsx#L65)), and is typing a coin name or an account label.

`n` is accounts: enabled networks × account types × discovered indices. It is not bounded by the app — a user who enables many coins and has several BTC account types per coin reaches three digits, and each of those rows is four store subscriptions plus four formatters. Nothing on the path is virtualised, so the commit is proportional to the _filtered_ list, which is the _whole_ list until the first character narrows it.

What the current code buys and what it costs:

- **It costs 200 ms on every settled query, unconditionally.** The timer is re-armed on each character ([`:43`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/search/src/components/SearchForm.tsx#L43) deps include `inputText`), so the list is frozen for the entire time the user is typing and only starts working 200 ms after they stop. On a device that could have rendered the intermediate results comfortably, that latency is paid for nothing.
- **It buys nothing for a slow typist.** Mobile typing above ~200 ms per character — which is most one-thumb typing on a phone — clears the timer's protection entirely: every character then triggers a full, urgent, uninterruptible commit, exactly as if there were no debounce.
- **It does not make the commit interruptible.** Once the timeout fires, `setSearchValue` is an urgent update. If the user types again while React is rendering 120 rows, that keystroke waits.

After the change the list starts narrowing on the first character, at transition priority. React can abandon a deferred pass that a newer keystroke supersedes, so a burst of typing converges on one final list instead of one list per debounce window, and the intermediate passes yield rather than blocking. The user sees results appear sooner and, for one transition, results for the previous query — the same one-frame staleness the web sidebar accepts in `p1-13`.

**Honest sizing: low, and rejectable.** `useDeferredValue` does not make any single filter or row cheaper. It moves the work off the keystroke's frame and makes it discardable. Against a debounce that is _already there_, the argument is a latency argument, not a jank argument — and the counter-argument below is real.

## Notes

- **The strongest reason to reject this.** On a genuinely slow Android device the debounce may be doing real work that deferral does not replicate: it cuts the _number_ of render passes outright, whereas `useDeferredValue` starts a background pass after each keystroke. React can abandon those passes, but abandoned work is not free — it has already rendered some prefix of the tree before yielding, and Hermes has no `scheduler.yield`, so React's time-slicing granularity on RN is coarser than in Chromium. Total CPU spent per typed word can therefore go **up**, while time-to-first-visible-result goes down. If the reviewer's priority is battery and thermals on low-end Android rather than perceived latency, keeping the debounce is a defensible answer and this issue should be closed. The middle path — deferral _plus_ a much shorter debounce, say 50 ms — is available but is not what this document proposes, because it reintroduces the fixed-guess problem in miniature.
- **The second reason to reject: `useSyncExternalStore`.** Every row reads redux through `useSelector` (react-redux 9.3.0, [`suite-native/app/package.json:161`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app/package.json#L161)), which subscribes via `useSyncExternalStore`. The deferral itself originates in React state, so the deferred pass _is_ concurrent — but if the store commits while that pass is in flight (a fiat-rate tick, a discovery progress update, a blockchain notification — all frequent in Suite), React discards it and re-renders synchronously. That resynchronisation is precisely the long uninterruptible task this document is trying to remove. How often it fires is an empirical question this document cannot answer by reading, and a reviewer should push here first.
- **`useDeferredValue` genuinely works on this build.** React is 19.2.3 ([`suite-native/app/package.json:142`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app/package.json#L142)) and the New Architecture is on ([`suite-native/app/android/gradle.properties:38`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app/android/gradle.properties#L38)), so Fabric renders through a concurrent root. This is not a case where the API exists but degrades to a no-op.
- **No memo thrash, and no `useMemo` needed.** The three filtering selectors are built with `createWeakMapSelector`, which uses reselect's `weakMapMemoize` for both result and args ([`suite-common/redux-utils/src/selectorsUtils.ts:24`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/redux-utils/src/selectorsUtils.ts#L24)) — an unbounded cache, not an LRU of one. Alternating between the live and the deferred query string therefore hits cache on both, which is the failure mode that makes `useDeferredValue` counter-productive elsewhere. suite-native is compiled with React Compiler ([`suite-native/app/app.config.ts:326`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app/app.config.ts#L326)), and the three list components are already `React.memo`-wrapped by hand, so no explicit memoisation is added here.
- **`InteractionManager` is deliberately not used, and could not help.** On the pinned React Native (`react-native@0.85.3`, [`suite-native/app/package.json:145`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app/package.json#L145)) `InteractionManager` is `InteractionManagerStub` — every member `@deprecated`, `runAfterInteractions` a bare `setImmediate`, `setDeadline` literally a no-op. It has no interaction- or frame-awareness. Even if it did, it is a task scheduler, and the problem here is a React render, whose only priority lever is `startTransition`/`useDeferredValue`. **`skills/performance-scheduling/SKILL.md` still describes `InteractionManager.runAfterInteractions` as React Native's nearest equivalent to `requestIdleCallback` and needs a follow-up correction** — that applies across this sweep's native documents, not just this one.
- **The After hunks have not been compiled.** They are written against the surrounding types by reading.
- **Removing the debounce affects three more screens, which is why hunk 3 exists.** `SearchForm` is also rendered by `useScreenHeaderSearch` ([`:43`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/search/src/hooks/useScreenHeaderSearch.tsx#L43)), used by coin enabling, network settings and add-coin-account. There `n` is the network list — bounded and small — but `SettingsNetworksScreen` wraps the result in an `AnimatedBox layout={LinearTransition}` ([`:32`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-settings/src/screens/SettingsNetworksScreen.tsx#L32)), so per-keystroke updates would restart that layout animation on every character. Deferring inside the hook keeps those screens no worse than today. A reviewer may reasonably prefer to leave the debounce in place and defer only in `AccountsListWithFilter`, at the cost of `SearchForm` keeping two scheduling mechanisms.
- **Calling a hook inside the returned object literal (hunk 3) is legal but reads oddly.** `useDeferredValue` there is unconditional and at the top level of the hook body, so the rules of hooks hold, but if review finds it obscure it should be hoisted to a named `const deferredSearchQuery` above the return.
- **Analytics fires earlier.** `onSearchUsed` is guarded by a ref and fires once per search session on the first non-empty value ([`useScreenHeaderSearch.tsx:33`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/search/src/hooks/useScreenHeaderSearch.tsx#L33)). Without the debounce it fires on the first character instead of 200 ms after the pause — same event, same cardinality, slightly earlier timestamp.
- **The unmount clear must stay.** The second effect at [`SearchForm.tsx:45`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/search/src/components/SearchForm.tsx#L45) calls `onInputChange('')` on teardown; without it a stale filter survives the search box closing. Hunk 1 keeps it verbatim. One incidental behaviour change: today the debounce effect also fires once on mount with `''`, which the new code no longer does — harmless, since the consumers already initialise to `''`.
- **The empty-state stays consistent without extra work.** `AccountsList` derives `isFilterEmpty` from the same `searchValue` prop it filters with ([`:33`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/accounts/src/components/AccountsList/AccountsList.tsx#L33)), so deferring _above_ it means the list and the placeholder always agree. Deferring inside `AccountsList` instead would flash the wrong placeholder — worth stating because it is the obvious-looking alternative placement.
- **What I deliberately did not change.** The network filter (`filteredNetworks`, applied from a bottom sheet) stays urgent: it is a discrete confirmed action, not a per-character stream, and deferring it would make the "apply" button feel unresponsive. Virtualising the list is also out of scope and is the bigger, independent win — if a heavy-wallet user still stutters after this change, a `FlashList` on the flattened accounts is the real fix, and scheduling is not.
- **Tests.** No unit test covers `SearchForm`, `AccountsListWithFilter` or `AccountsList`; the accounts tests under `suite-native/accounts/src` cover selectors and label components only. The Detox suites do not drive the accounts search box (the `search-input` page objects there belong to trading and residence pickers). So there is nothing that will break, and equally nothing that will catch a regression — manual verification on a low-end Android with many coins enabled is the only real check, and this issue should not merge without one.
- **Packaging.** suite-native only. All three packages are private, no published API changes, and no dependency is added — this document needs neither `yieldToMain` nor `runWhenIdle`.
- **Same lever elsewhere.** `p1-12` (tokens table), `p1-13` (web accounts sidebar) and `p2-05` (coin control) are the same `useDeferredValue` change on web trees. This is the only native one, and it is the weakest of the four, because it is the only one where a debounce already exists.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
