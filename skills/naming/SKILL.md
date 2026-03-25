---
name: naming
description: Naming conventions for variables, functions, booleans, components, and domain-specific terms in Trezor Suite. Use when naming anything in the codebase.
---

# Naming

## Obscure naming

Avoid using weirdly shortened words and especially single letter variables. It's not that obvious why there is a `device` located in object `s`.

## Generic vs lengthy naming

Often picking a generic name clashes with picking a long name. Code benefits from clarity of intent, treating every block like it's unique helps dive into the context and pick a name specific to that context. Also, don't be afraid of long names, it doesn't have to be < 8 characters all the time. If you think that a variable is better described by that 25 character-long abomination and nothing could describe it with the same clarity - go with it.

## Values = nouns, functions = verbs

That should be pretty self-explanatory. Try to prefix functions returning a value that you need with a verb like `get` or `calculate`. It also concerns the component names, which should _always be_ _nouns._

## Boolean values = questions

_Yes_ or _no_, _true_ or _false_, ask a question, get an answer. If that's not applicable to the data you are trying to describe, perhaps it would be better to pick another data type, like an `enum`.

- 🛑 `const disabled = true` → ✅ `const isDisabled = true`
- 🛑 `const finished = true` → ✅ `const hasFinished = true`

## Component interface

Should be named in the form of `${componentName}Props`

## Abbreviations in names

It is a matter of taste but we aim for consistency, so we voted and using all capital letters for abbreviations won. Consistency is important so we don't need to think about it anymore.

```tsx
// bad
const someFaqConstant;
function enterThpPairingCode;

// also bad
const someTHPFAQConstant;
// avoid
const FAQConstant;
const someNotVeryObviousAbbreviationLikeSNVOA;

// 🟢 good
const someFAQConstant;
function enterTHPPairingCode;

```

## Suite specific naming

Recommended naming for some Suite specific stuff.

### Crypto currencies symbols/networks

```tsx
// bad
const coin = networks['btc'];
const currency = networks['btc'];

// good
const network = networks['btc'];
```

```tsx
// bad
const coin = networks['btc'].symbol;
const currency = networks['btc'].symbol;
const currencySymbol = networks['btc'].symbol;
const coinSymbol = networks['btc'].symbol;

// good
const networkSymbol = networks['btc'].symbol;
```

### Fiat currencies

Always prefix names related to fiat currencies with `fiat`.

```tsx
// bad
const currency = 'usd';
const selectCurrency = () => 'usd';
const formatCurrency = value => value;

// good
const fiatCurrency = 'usd';
const selectFiatCurrency = () => 'usd';
const formatFiatCurrency = value => value;
```

### Assets

Assets are currently only a mobile-related thing (requested by product), but this will probably go into desktop suite too in future. **Asset is just different name for group of accounts for the same network.**

```tsx
// We want to show all accounts of given network type

// bad
// Asset is not single account but all account of given type grouped
const AccountsListScreen = () => <Screen />;

// fine
const AccountsForNetworkScreen = () => <Screen />;

// best (preferred)
const AssetsAccountsListScreen = () => <Screen />;
```

```tsx
// We want to show Account Detail

// bad
// Asset is not single account but all accounts of given type
const AssetDetailScreen = () => <Screen />;

// good
const AccountDetailScreen = () => <Screen />;
```

```tsx
// We want to show overview of balances (or anything) per network

// bad
// Accounts are grouped and hidden under single item per network for assets
// so it's not list of individual accounts.
const AccountsList = () => <... />;

// good
const AssetsList = () => <... />;
```
