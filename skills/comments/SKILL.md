---
name: comments
description: Comment conventions for Trezor Suite — prefer self-documenting code, extract and name logic rather than explaining it in a comment paragraph, and how to write and format a comment when one is actually needed. Use when writing or reviewing code comments, or when a block needs a comment before it makes sense.
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

## Give a name to logic the reader has to decode

Sometimes the honest fix for a block that needs a comment is not a better comment — it is a name. Two
concrete triggers:

- **A block needs a multi-line comment before it makes sense.** Extract it into a named function and let
  early returns replace the nesting. The long comment then hangs on the extracted unit instead of on a line
  only someone already inside the block will ever see. `getPoolDelegation`
  ([stakeFormCardanoActions.ts:313](../../packages/suite/src/actions/wallet/stake/stakeFormCardanoActions.ts))
  came out of exactly this.
- **The same compound condition appears twice.** Hoist it into a named `const` — `apyAvailable`
  ([EarnStakingAccountRow.tsx:297](../../packages/suite/src/components/earn/dashboard/staking/EarnStakingAccountRow.tsx))
  is read at two branches that previously each spelled the check out, and would have drifted the moment a
  third status was added.

A component body that assembles a `ReactNode` into a `let` through an `if / else if / else` chain is the same
defect wearing JSX: extract it into its own component and each case returns.

```tsx
// bad - the pre-fix shape from #30255 - three layouts assembled into a `let` before the screen renders
// anything, so the reader unwinds the chain to find the actual output
let transactionTitle: ReactNode;
if (isUnstakeTransaction) {
    transactionTitle = <UnstakeTransactionDetailTitle unstakeAmount={unstakeAmount} />;
} else if (wrapKind) {
    transactionTitle = <WrapTransactionName transaction={transaction} kind={wrapKind} />;
} else {
    transactionTitle = <TransactionName transaction={transaction} isPending={isPending} />;
}

// good - TransactionDetailTitle.tsx:21 - each case returns and is then forgotten; the screen renders
// <TransactionDetailTitle /> and the name says what it is
export const TransactionDetailTitle = ({ transaction, isPending }: Props) => {
    const unstakeAmount = getUnstakeTxAmount(transaction);
    const wrapKind = getNativeWrapTxKind(transaction);

    if (unstakeAmount !== undefined) {
        return <UnstakeTransactionDetailTitle unstakeAmount={unstakeAmount} />;
    }

    if (wrapKind) {
        return <WrapTransactionName transaction={transaction} kind={wrapKind} />;
    }

    return <TransactionName transaction={transaction} isPending={isPending} />;
};
```

Don't extract a single-use one-liner — the triggers above are the whole rule, and a comment explaining
genuinely non-obvious _why_ stays a comment.

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
