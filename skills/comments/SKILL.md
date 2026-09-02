---
name: comments
description: Comment conventions for Trezor Suite — prefer self-documenting code, and how to write and format a comment when one is actually needed. Use when writing or reviewing code comments.
---

# Comments

## Prefer self-documenting code

The best comment is usually no comment. A clear name says more than a line explaining an unclear one, so reach for a comment only when the code genuinely can't speak for itself.

```tsx
// bad - the comment only restates the code
// Get the account balance.
const b = getBalance(account);

// good - the name carries the meaning, no comment needed
const accountBalance = getBalance(account);
```

## Comment the _why_, not the _what_

When you do comment, explain intent, edge cases, or non-obvious reasoning — things the code cannot express on its own.

```tsx
// bad - restates what the reader can already see
// Increment the index.
index += 1;

// good - explains a decision the reader can't infer from the code
// Firmware < 2.6.0 reports the fee in a different unit, so we normalize here.
const fee = normalizeFee(rawFee, firmwareVersion);
```

## Start with an uppercase letter and end with a period

Applies to every comment, single- or multi-line.

```tsx
// This is a comment that helps you understand what is happening in the code
// below.
const someFunction = () => null;
```

## Multiline comments

Stack `//` lines and wrap at the print width. Capitalize only the first line and end only the last line with a period.

```tsx
// We debounce the search input because the backend rate-limits requests, and
// firing on every keystroke would exhaust the quota during fast typing.
const debouncedSearch = useDebounce(search, 300);
```

Reserve `/** */` JSDoc blocks for documenting exported APIs, where editors surface the description on hover.

```tsx
/**
 * Converts an amount from the smallest unit (e.g. satoshis) to the main unit.
 */
export const formatAmount = (amount: string, decimals: number) => {
    // ...
};
```

## Comments in components (JSX)

Inside JSX, wrap comments in `{/* */}` and place them above the element they describe. The uppercase-and-period rule still applies.

```tsx
export const AccountBalance = ({ account, isLoading }: AccountBalanceProps) => (
    <Row>
        {/* Skeleton keeps the layout stable while the balance loads. */}
        {isLoading ? <Skeleton /> : <Balance value={account.balance} />}
    </Row>
);
```

Multiline JSX comments keep the same wrapping rules:

```tsx
{
    /* The balance aligns with the right edge of the vault name above; when the
    name is shorter, the gap keeps it 24px from the label. */
}
```
