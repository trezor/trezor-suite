Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Never add a new `eslint-disable` for `exhaustive-deps`"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/PageNames/AccountName/AccountName.tsx:23-54`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/PageNames/AccountName/AccountName.tsx#L23-L54)

Co-anchors showing the ref's target genuinely mounts/unmounts across the loading→loaded transition:

- [`AccountOverviewBalance.tsx:85`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/components/AccountOverviewBalance.tsx#L85) — `<Column ref={balanceSectionRef}>`, reached only once `status === 'loaded' && account` (the two branches above it, `status === 'exception'` and `status !== 'loaded'`, return `null`/a skeleton with no ref at all)
- [`Transactions.tsx:46-48,85,92,106,117`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/Transactions.tsx#L46-L48) — the four places `<AccountOverviewBalance>` is rendered all sit behind `selectedAccount.status !== 'loaded'`'s early return at `:46-48`
- [`AccountHeaderProvider.tsx`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/AccountHeaderProvider.tsx) — the shared context both files above and `AccountName.tsx` thread the same ref object through

## Before

```tsx
useEffect(() => {
    if (!isOverviewRoute) {
        setIsScrolled(true);

        return;
    }

    const target = balanceSectionRef?.current;
    if (!target) {
        setIsScrolled(false);

        return;
    }

    const observer = new IntersectionObserver(
        ([entry]) => {
            if (entry) {
                setIsScrolled(!entry.isIntersecting);
            }
        },
        {
            root: null,
            threshold: 0,
            rootMargin: `-${HEADER_HEIGHT} 0px 0px 0px`,
        },
    );

    observer.observe(target);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [balanceSectionRef?.current, isOverviewRoute]);
```

`balanceSectionRef?.current` is a mutable ref read; mutating `.current` never itself schedules a
re-render, so this dependency array item is only ever re-evaluated against whatever `.current` happens
to hold _during a render triggered by something else_. If `AccountName`'s own re-render and the
balance section's DOM remount land in the same commit, the array is diffed before that commit's ref
mutation runs, so the snapshot can match the previous render's and the effect silently skips
re-running against the new node.

## After

The ref needs to become something reactive at its source — `AccountName.tsx` alone cannot fix this,
since it only reads the ref, it doesn't attach it. `Column`'s `ref` prop
(`packages/components/src/components/Flex/Flex.tsx:144`) is typed as a plain
`React.RefObject<HTMLElement | null>`, not the full callback-ref union, so the shared ref itself has to
stay a ref for attachment — but the context that threads it between the header and body subtrees can
also expose the attached node as state:

### 1. `AccountHeaderProvider.tsx`

```tsx
import React, { createContext, useContext, useRef, useState } from 'react';

type AccountHeaderContextValue = {
    balanceSectionRef: React.RefObject<HTMLDivElement | null>;
    balanceSectionNode: HTMLDivElement | null;
    setBalanceSectionNode: (node: HTMLDivElement | null) => void;
};

// ...

export const AccountHeaderProvider = ({
    balanceSectionRef: providedBalanceSectionRef,
    children,
}: AccountHeaderProviderProps) => {
    const internalBalanceSectionRef = useRef<HTMLDivElement>(null);
    const balanceSectionRef = providedBalanceSectionRef ?? internalBalanceSectionRef;
    const [balanceSectionNode, setBalanceSectionNode] = useState<HTMLDivElement | null>(null);

    return (
        <AccountHeaderContext.Provider
            value={{ balanceSectionRef, balanceSectionNode, setBalanceSectionNode }}
        >
            {children}
        </AccountHeaderContext.Provider>
    );
};
```

### 2. `AccountOverviewBalance.tsx` — mirror the ref into that state after every commit

```tsx
const { balanceSectionRef, setBalanceSectionNode } = useAccountHeaderContext();

useEffect(() => {
    setBalanceSectionNode(balanceSectionRef.current);
});
```

(Declared with the component's other hooks, above its `status === 'exception'` / `status !== 'loaded'`
early returns. No dependency array — it runs after every commit of this component, which is exactly
when `balanceSectionRef.current` may have changed; the state setter itself bails out via `Object.is`
when the node is unchanged, so this doesn't add extra re-renders.)

### 3. `AccountName.tsx` — depend on the state, not on `.current`

```tsx
const accountHeaderContext = useOptionalAccountHeaderContext();
const balanceSectionNode = accountHeaderContext?.balanceSectionNode ?? null;
const isOverviewRoute = routeName === 'wallet-index';

useEffect(() => {
    if (!isOverviewRoute) {
        setIsScrolled(true);

        return;
    }

    if (!balanceSectionNode) {
        setIsScrolled(false);

        return;
    }

    const observer = new IntersectionObserver(
        ([entry]) => {
            if (entry) {
                setIsScrolled(!entry.isIntersecting);
            }
        },
        {
            root: null,
            threshold: 0,
            rootMargin: `-${HEADER_HEIGHT} 0px 0px 0px`,
        },
    );

    observer.observe(balanceSectionNode);

    return () => observer.disconnect();
}, [balanceSectionNode, isOverviewRoute]);
```

No `eslint-disable` left — `balanceSectionNode` is a plain state value, so the dependency array is
exhaustive and honest. Because it's real React state, a change to it always schedules a fresh render of
`AccountName` in its own right (it's read through context, not sampled mid-render off a mutable
object), which is what removes the same-commit race entirely.

## Why it matters

If the balance-section DOM node swaps out (component remount on the loading→loaded transition) in the
same commit that re-renders `AccountName` for an unrelated reason, today's dependency array can miss
it: React compares the _render-time_ snapshot of `balanceSectionRef?.current` against the previous
render's snapshot, before the commit that actually mutates `.current` happens, so the two can appear
equal even though the observer now points at a detached node. When that happens, the compact/expanded
header state (`isScrolled`) freezes until something else forces the effect to re-run — a stuck-looking
header, not a crash, which is exactly why it's easy to miss in review and why the suppression was
reached for instead.

## Notes

- Compile requirements: `AccountHeaderProvider.tsx` needs `useState` added to its existing
  `import React, { createContext, useContext, useRef } from 'react';`. `AccountOverviewBalance.tsx`
  needs a new `import { useEffect } from 'react';` — it currently has no React import at all (a
  function component using only `useSelector` and the account-header-context hook).
  `AccountName.tsx` needs no new imports; it already imports `useEffect`/`useState`.
- `WalletLayout.tsx:82,90` creates the externally-shared `balanceSectionRef` and passes the _same_
  `RefObject` into two separate `<AccountHeaderProvider>` instances (one wrapping the page header via
  `useLayout`, one wrapping the account body) — that's how a header component can observe a DOM node
  that actually lives in the body subtree. This file needs no change: the provider still accepts and
  forwards the same prop, it just also mirrors the attached node into state internally.
- This is a bigger diff than most findings in this sweep (three files, not one) because the ref is
  deliberately shared across two separate component subtrees via `AccountHeaderProvider`, and
  `AccountName.tsx` only ever reads that ref — it never attaches it. There's no fix scoped to
  `AccountName.tsx` alone; the reactivity has to be added at the shared source.
- Confidence on the exact runtime trigger (an account switch landing in the same commit as the balance
  section's own loading→loaded remount) is medium — the scan traced the mechanism but didn't confirm
  the interleaving happens in production. The restructure is still worth doing on its own merits: it's
  the only `eslint-disable-next-line react-hooks/exhaustive-deps` either scanned area (`packages/suite/src/components/suite`,
  `packages/suite/src/views/wallet`) found on a `useEffect`, and removing it re-enables the lint rule's
  protection for this file going forward.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
