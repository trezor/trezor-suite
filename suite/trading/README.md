# Trading Module Architecture Guide

## Table of Contents

1. **[Overview & Core Principles](#1-overview--core-principles)**
2. **[Folder Structure & Scope](#2-folder-structure--scope)**
3. **[Architecture Rules (Fractal Design)](#3-architectural-rules)**
4. **[Domain Specificity (Composition vs Abstraction)](#4-domain-specificity-composition-over-abstraction)**
5. **[Exports & Tree-shaking Strategy](#5-exports--tree-shaking-strategy)**

---

## 1. Overview & Core Principles

The `trading` package is a self-contained, pluggable suite module encompassing all trading-related logic and UI. It is designed to be highly decoupled from the main application suite.

### Core Principles

- **Pluggable Design**: Treat this package as an independent module. It should be easily "pluggable" into the main application.
- **Strict Dependency Flow**:
    - **Allowed**: Importing from `common` or `shared` packages.
    - **Prohibited**: Importing from the main `package/suite`.
    - **Refactor Signal**: If you need a `trading` utility inside the main `suite`, that utility must be moved to `suite-common/trading`.

---

## 2. Folder Structure & Scope

The module follows a **Domain-Driven** approach nested within the `views/` directory.

### Scope-Based Placement (The "Rule of Two")

To maintain a clean codebase, follow these placement rules:

- **Local Scope**: If a resource is used **only** within one specific view (e.g., `buy`), it **must** stay within `views/buy`.
- **Module Scope**: If a resource is shared between **two or more** views (e.g., `buy` and `sell`), move it to the root folders of the `trading/` package (e.g., `trading/hooks/`).
- **External Scope**: If a resource is needed **outside** the `trading` package (e.g. in the Settings), it must be moved to `suite-common/trading`.

### Directory Breakdown

```text
trading/
├── components/          # Shared UI used across multiple trading views
├── constants/           # Constants shared within the trading module
├── hooks/               # Logic shared across multiple trading views
├── types/               # TypeScript definitions for the trading domain
├── utils/               # Helper functions shared within the module
└── views/               # Domain-specific pages and their local assets
    ├── buy/
    │   ├── components/  # Local UI (e.g., BuyForm, BuySuccessModal)
    │   ├── hooks/       # Hooks used only within the Buy flow
    │   ├── utils/       # Math specific to buying logic
    │   └── TradingBuyPage.tsx
    ├── concierge/
    ├── exchange/
    └── sell/

```

---

## 3. Architectural Rules

### Fractal Organization

We use a **fractal** structure inside `views`. Each domain (like `buy`) acts like a mini-version of the main package. This ensures that deleting a feature is as simple as deleting its folder, without leaving orphaned code in global directories.

### Component Internalization

When a component becomes complex (like `TradingBuyForm`), it should be turned into a folder containing its own logic (`useTradingForm.ts`) and styling. This keeps the high-level page component clean.

> **Note on Refactoring**: Always favor keeping code as local as possible. Do not move a hook to the root `trading/hooks/` folder "just in case." Move it only when a second view actually requires it.

---

## 4. Domain Specificity: Composition over Abstraction

We prioritize **Domain Specificity** over generic abstractions. We strictly avoid "God-hooks" or "Universal Types" that attempt to handle multiple trading flows within a single logic block.

### The Composition Pattern

Instead of branching logic inside a large hook using `if/else` or `switch`, we build specific **View-level hooks** by composing small, single-purpose **Atomic hooks** from the package root.

#### Root Atomic Hooks (`trading/hooks/`)

These hooks perform one task with a guaranteed, simple return type:

- `useAccountBalance(asset: string)`
- `useMarketPrice(pair: string)`

#### View-Specific Hooks (`trading/views/buy/hooks/`)

These orchestrate atomic hooks for a single view. The return type is **deterministic**.

```typescript
// ✅ RECOMMENDED: Specific and deterministic
const useBuyForm = () => {
    const { balance } = useAccountBalance('BTC');
    const { price } = useMarketPrice('BTC/USD');

    return {
        buyBalance: balance, // Explicitly named for the Buy context
        currentPrice: price,
    };
};
```

### Eliminating Type Casting (`as`)

The use of the `as` keyword is considered a **Code Smell**. If you are forced to cast, it usually means:

1. The hook return type is an ambiguous **Union** (e.g., `BuyData | SellData`).
2. The abstraction is too broad with too many optional fields.

**Rule:** If you need `as` to access data, refactor the hook to return a specific type for that View.

| Feature         | Generic "God-Hook"            | Composed Hook          |
| --------------- | ----------------------------- | ---------------------- |
| **Logic Flow**  | Complex `if (type === 'buy')` | Flat and linear        |
| **Return Type** | Ambiguous Union               | Strictly Deterministic |
| **Maintenance** | High risk of regressions      | Isolated and safe      |

---

## 5. Exports & Tree-shaking Strategy

The `trading` module is architected for **Tree-shaking** to ensure optimal bundle sizes.

### The "Public API" Pattern

Each sub-folder within `views/` acts as a self-contained domain with a strictly defined **Public API** via an `index.ts` file.

- **Internal Scope**: Local hooks and sub-components should only be imported within their specific domain.
- **Public API**: Only the entry-point (e.g., `TradingBuyPage.tsx`) is exposed via `index.ts`.

### Strategic Use of Barrel Files

Barrel files should **only** exist at the domain level. Avoid creating a "Mega-Barrel" at the root of the `trading` package.

#### ✅ Correct Export (`trading/views/buy/index.ts`):

```typescript
export { TradingBuyPage } from './TradingBuyPage';
```

#### ❌ Anti-pattern (Avoid `trading/index.ts`):

```typescript
export * from './views/buy';
export * from './views/sell';
// Reason: Forces the bundler to crawl every view, causing "Bundle Bloat."
```

### Direct Import Policy

Always use **Deep Imports** when consuming the module from the main application.

- ✅ **Optimized**: `import { Buy } from '@suite/trading/views/buy';`
- ❌ **Discouraged**: `import { Buy } from '@suite/trading';`

---
