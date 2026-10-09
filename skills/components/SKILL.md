---
name: components
description: React component file structure and patterns for Trezor Suite. Use when creating, refactoring or reviewing React components, including prop passing, component organization and directory layout.
---

# Components

## One React component per file

- Never use inline React components.
- Each React component must be defined as a separate function in its own file.
- Render helpers count too: a `renderWarning()` or `getBanner()` that returns JSX is a component in disguise, so extract it into its own component instead of calling it from the render.

Bad:

```tsx
export const Foo = () => {
    const Bar = () => <div>Bar</div>;

    return (
        <div>
            <Bar />
        </div>
    );
};
```

```tsx
const Bar = () => <div>Bar</div>;

export const Foo = () => {
    return (
        <div>
            <Bar />
        </div>
    );
};
```

```tsx
export const Foo = () => {
    const renderBar = () => <div>Bar</div>;

    return <div>{renderBar()}</div>;
};
```

Good:

```tsx
// File: Bar.tsx or Bar/Bar.tsx
export const Bar = () => <div>Bar</div>;

Bar.displayName = 'Bar';
```

```tsx
// File: Foo.tsx or Foo/Foo.tsx

import { Bar } from './Bar';

export const Foo = () => (
    <div>
        <Bar />
    </div>
);

Foo.displayName = 'Foo';
```

## Component File structure

1. Imports
2. Styles
3. Component constants
4. Component helpers
5. Component types
6. Component

Component helpers, Component types, Styles: If there's more of them or they're not straightforward, consider moving them to a separate file to keep the component file clean.

Use `styled` only in `@trezor/components` and `@trezor/product-components`. Everywhere else, build the UI from those libraries' components and configure them through props; reach for `styled` very rarely, ideally never, and don't take the existing `styled` code in `packages/suite` and `suite/` as a pattern. Inside the two libraries, styled components count as styles rather than components, so they can stay in the component file or move to `Foo.styles.ts`.

Nest a child component inside its parent's directory when only that parent renders it, so the path shows the relationship. A component that several parents render moves up to their closest common directory, the same way shared hooks do.

## Component Definition

- There're basically two ways to define a component in React: as a function declaration or as a function expression (arrow function).
- Don't use arrow functions for defining components without `displayName`. It's important to set the `displayName` property for better debugging and readability in React DevTools.
- Use `function` declarations for defining components instead of arrow functions if there's no immediate return statement.
- Don't use `displayName` with `function` declaration.

Bad:

```tsx
const Foo = () => {
    return <div>Hello World</div>;
};

Foo.displayName = 'Foo'; // redundant, better use function declaration instead
```

```tsx
function Foo() {
    return <div>Hello World</div>;
}

Foo.displayName = 'Foo'; // duplicit, not needed for function declaration
```

```tsx
const Foo = () => <div>Hello World</div>; // arrow function without displayName, not recommended
```

Good:

```tsx
function Bar() {
    // function declaration, no need for displayName
    return <div>Hello World</div>;
}
```

```tsx
const Bar = () => <div>Hello World</div>; // anonymous function, needs displayName

Bar.displayName = 'Bar';
```

## Component structure

The following structure is just a recommendation, in fact it's not even always possible to keep the same order inside a component. However, trying to be consistent really helps in the long run, especially when it comes to navigating larger components. It is also useful to group things within each category, e.g. the refs might not have empty lines between each other but if there is only one `useDispatch` better surround it with them.

1. Redux selectors _(aka global state)_
2. `useState` _(aka local state)_
3. Non-effect hooks: `useRef`, `useForm`, `useDispatch`, etc
    1. This one is tricky. Consistency among the non-effect hook order is perhaps too redundant, although I would always put `useForm` first, for example. Try to place them in the order of subjective importance.
4. Effects
5. Functions / callbacks
6. Values
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

## Derived state: a local context instead of a resolving parent

The same goes for state that does not live in Redux. A flow hook or a form tends to hand one parent everything it knows, and the parent then works out every status itself — which banner applies, which amount it quotes, whether a notice shows — and drills the results down as formatted values and booleans. Each new variant adds a branch to the parent and a prop to the component it renders, until neither reads on its own.

Give the subtree a small local context instead, and let each component decide for itself:

- **The context holds the minimal raw state the subtree needs** — a balance, the amount issues, a fee status, a pending flag — selected from the flow by a value hook. Not the whole flow object, and not pre-resolved booleans, so the subtree's inputs are visible at a glance and a test can build them by hand.
- **Each component resolves its own conditions and formatting** in its own hook, then renders its own markup or returns `null`. The parent only places the subtree.
- **The directories mirror the component tree**, so a file's path says which component it belongs to.

Moving the derived values into the form or flow context is not a fix either: a context that carries everything ties each consumer to all of it, and every new variant grows it further.

```tsx
// bad - the form resolves the warnings of every step and drills each result into one component
// that has a prop per banner
const renderWrapWarning = () => {
    if (!wrapPendingTransaction && insufficientFeeReserve) {
        return <YieldActionStepWarning insufficientFeeReserve={insufficientFeeReserve} />;
    }

    if (shouldCheckWrapAmount && isAmountTooHigh) {
        return <YieldActionStepWarning isInsufficientFunds />;
    }

    // ...two more branches here, then the same again for the approve and deposit steps
};

<YieldWrapStep warning={renderWrapWarning()} />;

// good - the form only places the subtree, and each warning decides for itself
<YieldWrapStep warning={<WrapStepWarnings />} />;

export const WrapStepWarnings = () => (
    <WrapStepWarningsProvider>
        <InsufficientFeeReserveWarning />
        <InsufficientFundsWarning />
        <ReserveKeptWarning />
        <ReserveRecommendationWarning />
    </WrapStepWarningsProvider>
);

WrapStepWarnings.displayName = 'WrapStepWarnings';

export function InsufficientFundsWarning() {
    const isVisible = useIsInsufficientFundsWarningVisible();

    if (!isVisible) {
        return null;
    }

    return (
        <Banner
            intent="warning"
            data-testid="@yield/warning/insufficient-funds"
            description={<Translation id="AMOUNT_IS_NOT_ENOUGH" />}
        />
    );
}
```

For example, `YieldDepositForm` could be laid out like this:

```
YieldDepositForm/
├── YieldDepositForm.tsx
├── useFeeReserveNotice.ts # used by more than one subtree below
├── useModifyApprovalHandler.ts # used by more than one subtree below
└── WrapStepWarnings/
    ├── WrapStepWarnings.tsx # provider and children, no logic
    ├── useSomething.ts # shared by sibling children
    ├── WrapStepWarningsContext/
    │   ├── WrapStepWarningsContext.tsx # createContext, displayName and the provider
    │   ├── useWrapStepWarningsContext.ts   # consumer, throws outside the provider
    └── InsufficientFundsWarning/       # a directory only once it has hooks or children
        ├── InsufficientFundsWarning.tsx
        └── useIsInsufficientFundsWarningVisible.ts
```

- One React component per file. Its hooks go next to it, and a hook that several siblings use moves to the closest common parent.
