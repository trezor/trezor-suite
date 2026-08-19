---
name: components
description: React component file structure and patterns for Trezor Suite, including one component per file and where an extracted helper component or hook goes. Use when creating or reviewing React components, including prop passing and component organization.
---

# Components

## 🟠 File structure

1. ↕️ Imports
2. 🎨 Styles
3. 📜 Component constants
4. 🛠 Component helpers
5. 🆎 Component types
6. 🎭 Component prop type
7. 🍱 Component

## Export one component per file, and give an extracted hook its own file

A file exports exactly one React component. A helper component that only this file uses still gets its own
file next to it — not a shared `parts.tsx` — and a hook extracted from a component goes into
`hooks/<useHookName>.ts(x)`, named after the hook
([useYourPositionCardYieldBadge.tsx](../../suite-native/module-accounts-management/src/hooks/useYourPositionCardYieldBadge.tsx)
is the shape, `.tsx` because it returns JSX-bearing values).

The second component in a file is reliably the part that later needs reuse or refactoring, and it is
reachable by neither filename nor a test that renders it alone.

```tsx
// bad - two components in one file; the fee row is not findable by filename and cannot be rendered on
// its own in a test
const CancelTransactionFeeRow = ({ title, fee, symbol }: CancelTransactionFeeRowProps) => (
    <TransactionDetailRow title={title}>{/* ... */}</TransactionDetailRow>
);

export const CancelEvmTransactionButton = ({ accountKey, transaction }: Props) => (
    <CancelTransactionFeeRow title={feeTitle} fee={fee} symbol={transaction.symbol} />
);

// good - CancelEvmTransactionButton.tsx - one component, with the row and the hook each in their own file
import { useCancelEvmTransaction } from '../hooks/useCancelEvmTransaction';

import { CancelTransactionFeeRow } from './CancelTransactionFeeRow';

export const CancelEvmTransactionButton = ({ accountKey, transaction }: Props) => {
    const { fee, cancel } = useCancelEvmTransaction({ accountKey, transaction });

    return <CancelTransactionFeeRow fee={fee} symbol={transaction.symbol} onPress={cancel} />;
};
```

Counting the components in a file is a job for `react/no-multi-comp`, which is not enabled yet; what a linter
cannot decide, and what this rule is therefore about, is _where_ the extracted unit goes.

## 🟠 Component structure

The following structure is just a recommendation, in fact it's not even always possible to keep the same order inside a component. However, trying to be consistent really helps in the long run, especially when it comes to navigating larger components. It is also useful to group things within each category, e.g. the refs might not have empty lines between each other but if there is only one `useDispatch` better surround it with them.

1. Redux selectors _(aka global state)_
2. `useState` _(aka local state)_
3. Non-effect hooks: `useRef`, `useForm`, `useDispatch`, etc
    1. This one is tricky. Consistency among the non-effect hook order is perhaps too redundant, although I would always put `useForm` first, for example. Try to place them in the order of subjective importance.
4. Effects
5. Functions / callbacks
6. Values / components
7. Render

Generally, it's considered a _good_ practice to not use optimisation techniques until you see that you need them. Also when it's obvious from the start that something would require to be memo'ed – _expensive calculation, frequent state updates, expensive re-renders._

## Passing props to components

Whenever you pass props to a component, prefer passing only the parts that are necessary and avoid passing a whole large object of which only one or two properties are used.

It creates a clearer interface of the component (you can see right from the interface what is used). And it prevents unnecessary re-renders.

```tsx
// good
const DeviceVersion = ({ version }) => <div>{version}</div>;

// bad
const DeviceVersion = device => <div>{device.version}</div>;
```

## Spacing

The `spacings` and `negativeSpacings` objects exported from `@trezor/theme` are deprecated. Use numbers directly instead (backed by `spacingsNew`).

```tsx
// bad - deprecated
margin-bottom: ${({ theme }) => theme.spacings.md}px;

// good
margin-bottom: 16px;
```

```tsx
// bad - deprecated
<Divider margin={{ vertical: spacings.xs }} />

// good
<Divider margin={{ vertical: 8 }} />
```

## Prop drilling and identifiers

Don't pass entire objects which have an identifier of some sort around in components too much. In simpler terms, consider the Redux store as the primary source for components to retrieve complete data. For instance, if you have three components (C1 ⇒ C2 ⇒ C3) and C1 receives an account key, if both C1 and C3 need the full account, they should use the `selectAccountById` selector to access it. C1 and C2 should only pass the `accountKey` as a prop to their children. This principle also applies to selectors, where the parameters should ideally be as granular as possible, like selecting something by `id` . This minimalistic approach simplifies the identification of what's necessary in components, helps avoid unnecessary re-renders, and slightly improves performance.
