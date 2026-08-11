# Rule template

Scaffold for adding a style rule to a `skills/*/SKILL.md`. Copy the blank entry, fill it in, and
check it against the checklist at the bottom.

## Before you write prose

If the rule can be expressed as an AST pattern, it belongs in
[`noRestrictedSyntax`](../../packages/eslint/src/javascriptConfig.mjs) or
[`eslint-local-rules/rules.ts`](../../eslint-local-rules/rules.ts) instead — a lint error reaches the
reader (human or model) at the moment of the mistake, which no document can do. Write prose only for
what a linter cannot decide: judgement calls, structure, naming, and asymptotics that depend on how
big the collection gets at runtime.

## Blank entry

````markdown
## <Rule as a directive — "Prefer X over Y", not "Ternaries">

<One or two sentences: state the rule, then why it exists. The why is what lets the reader
generalize to the near-miss case this entry doesn't spell out.>

```tsx
// bad - <what goes wrong>
<3–6 lines>

// good - <what the replacement buys>
<3–6 lines>
```
````

Use the two-block `🔴` / `🟢` form instead when the examples run past ~8 lines and need surrounding
prose, as in [basic-syntax](../basic-syntax/SKILL.md):

````markdown
## <Rule as a directive>

<One or two sentences.>

🔴 <What's wrong with it>:

```tsx
<longer example>
```

🟢 <What's better>:

```tsx
<longer example>
```

<Optional: one paragraph on the boundary — when the rule doesn't apply.>
````

## Filled examples

### Readability

````markdown
## Return early instead of nesting the happy path

Guard clauses keep the main path at one indent level, so the reader never has to hold a stack of
conditions in their head to find out what the function actually does.

```tsx
// bad - the result is buried three levels deep
const getAccountLabel = (account?: Account) => {
    if (account) {
        if (account.metadata) {
            return account.metadata.accountLabel ?? account.path;
        }
    }
};

// good - each precondition is discharged and forgotten
const getAccountLabel = (account?: Account) => {
    if (!account?.metadata) {
        return undefined;
    }

    return account.metadata.accountLabel ?? account.path;
};
```
````

### Asymptotic complexity

````markdown
## Index by key before iterating, don't scan inside a loop

A `.find()` inside a `.map()` is O(n·m) — fine for a settings list, quadratic for transactions or
tokens, where both sides grow with the account. Build a `Map` once and the lookup is O(1).

```tsx
// bad - rescans every token for each balance, O(n·m)
const rows = balances.map(balance => ({
    ...balance,
    token: tokens.find(token => token.contract === balance.contract),
}));

// good - one pass to index, one pass to join, O(n+m)
const tokensByContract = new Map(tokens.map(token => [token.contract, token]));

const rows = balances.map(balance => ({
    ...balance,
    token: tokensByContract.get(balance.contract),
}));
```
````

### Naming the replacement

A ban with no destination leaves the reader to invent one. Point at the exact API that replaces it.

````markdown
## Don't spread the accumulator in `.reduce()` — mutate it or use a Map

Each `{ ...acc }` copies everything accumulated so far, making the reduce O(n²) in allocations. The
accumulator is local to the reduce, so mutating it is safe.

```tsx
// bad - reallocates the whole object on every entry
const byId = accounts.reduce((acc, account) => ({ ...acc, [account.key]: account }), {});

// good - O(n), and the intent reads the same
const byId = new Map(accounts.map(account => [account.key, account]));
```
````

## The `description:` frontmatter

This line decides whether the skill gets loaded at all, so it has to say both _what_ the rules cover
and _when_ to reach for them. Formula:

```
<domain> for Trezor Suite — <the specific rules, comma-separated>. Use when <concrete trigger>.
```

```yaml
# too vague to trigger on anything
description: Code style rules.

# names the rules and the moment they apply
description: Collection-handling rules for Trezor Suite — indexing before iteration, reduce
    accumulators, and early exits from hot paths. Use when writing loops or array transformations
    over accounts, transactions, tokens, or UTXOs.
```

Prefer triggers phrased as things the reader is _doing_ ("writing a new Redux slice", "adding a
column to a table") over the abstract topic ("state management", "tables").

## Checklist

- [ ] Heading is a directive, not a topic label.
- [ ] Rule is not mechanizable — otherwise it's a lint rule, not an entry here.
- [ ] Exactly one bad/good pair, both compiling and both in repo idiom (4-space indent, arrow
      function consts, named exports).
- [ ] The bad example is one a person would plausibly write, not a straw man.
- [ ] One clause of _why_, not a paragraph — "harder to read", "O(n·m) on token lists", "typed as
      `any`, so nothing catches a typo".
- [ ] Every prohibition names its replacement, by exact API where there is one.
- [ ] Boundary stated if the rule has one ("fine for a fixed-size config array").
- [ ] `description:` names the rules and ends with a concrete "Use when …" trigger.
