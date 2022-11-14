# @suite-common/formatters

This package provides utility functions to set the standardized way to format values in our React components with a definition of custom _formatters_.

### Usage

-   all formatters should be accessed with hook `useFormatters()`

```typescript
const { CryptoAmountFormatter, SignValueFormatter, CurrencySymbolFormatter } = useFormatters();
```

and used in components with `.format()` method:

```typescript
const formattedSymbol = symbol ? CurrencySymbolFormatter.format(symbol) : '';
const formattedValue = CryptoAmountFormatter.format(value, {
    isBalance,
    symbol,
});

// output as a string, mostly for compatability with graphs
if (isRawString) {
    const displayedSignValue = SignValueFormatter.format(signValue);
    return <>{`${displayedSignValue} ${formattedValue} ${formattedSymbol}`}</>;
}
```

It can even be used as components:

-   **value** - the value to be formatted
-   other props - dataContext

```typescript
const { FiatAmountFormatter } = useFormatters();

<FiatAmountFormatter
    value={savingsTrade?.fiatStringAmount || 0}
    currency={savingsTrade?.fiatCurrency}
    minimumFractionDigits={0}
    maximumFractionDigits={2}
/>;
```

The simplest formatter looks like:

```typescript
const upperCaseFormatter = makeFormatter<string, string>(value => value.toUpperCase());
upperCaseFormatter.format('foo'); // "FOO"
```

Formatters are initialized in `FormatterProvider.tsx` which accepts the configuration object (for example some settings stuff like locale etc.). This is necessary because we want formatters to be independent as much as possible to make them work in all our apps (contexts).

```typescript
export const FormatterProvider = ({ config, children }: FormatterProviderProps) => {
    const contextValue = useMemo(
        () => ({
            CryptoAmountFormatter: prepareCryptoAmountFormatter(config),
            ....another formatters
        }),
        [config],

    return (
        <FormatterProviderContext.Provider value = { contextValue } >
...
)
    ;
```

-   formatters are objects with a `format` method. Formatters should be created solely using the `makeFormatter` factory.

```typescript
// src/kinds/prepareCryptoAmountFormatter.ts

export const prepareCryptoAmountFormatter = (config: FormatterConfig) =>
    makeFormatter<CryptoAmountFormatterInputValue, string, CryptoAmountFormatterDataContext>(
        (value, { symbol, isBalance, withSymbol = true }) => {
            const { locale, bitcoinAmountUnit } = config;

            // the rest functionality of your formatter...
            ...
            return formattedValue;
```
