# @suite-common/formatters

This package provides utility functions to set the standardized way to format values in our React components with a definition of custom _formatters_.

The simplest formatter looks like:

```typescript
const upperCaseFormatter = makeFormatter(value => value.toUpperCase());
upperCaseFormatter.format('foo'); // "FOO"
```

-   formatters are defined in `FormatterProvider.tsx` which accepts the configuration object (for example some settings stuff like locale etc.) for all kinds of formatters which are then being prepared with values from the config and passed to the context like:

```typescript
export const FormatterProvider = ({ config, children }: FormatterProviderProps) => {
    const contextValue = useMemo(
        () => ({
            cryptoAmountFormatter: prepareCryptoAmountFormatter(config),
            ....another formatters
        }),
        [config],

        return (
            <FormatterProviderContext.Provider value={contextValue}>
                ...
);
```

-   formatters are objects with a format method. Formatters should be created solely using the `makeFormatter` factory.

```typescript
// src/kinds/prepareCryptoAmountFormatter.ts

export const prepareCryptoAmountFormatter = (config: FormatterConfig) =>
    makeFormatter<CryptoAmountFormatterInputValue, string, never, CryptoAmountFormatterDataContext>(
        (value, dataContext) => {
            const { symbol, isBalance } = dataContext;
            const { locale, bitcoinAmountUnit } = config;

            // the rest functionality of your formatter...
            ...
            return formattedValue;
```

### Usage

-   all formatters can be accessed with hook `useFormatters()`

```typescript
const { cryptoAmountFormatter, signValueFormatter, currencySymbolFormatter } = useFormatters();
```

and used in components:

```typescript
const formattedSymbol = symbol ? currencySymbolFormatter.format(symbol) : '';
const formattedValue = cryptoAmountFormatter.format(value, {
    isBalance,
    symbol,
});

// output as a string, mostly for compatability with graphs
if (isRawString) {
    const displayedSignValue = signValueFormatter.format(signValue);
    return <>{`${displayedSignValue} ${formattedValue} ${formattedSymbol}`}</>;
}

// component - data obtained as the object with a type of your choice...
return (
    <Container className={className}>
        {signValue && <Sign value={signValue} />}

        <Value data-test={dataTest}>{formattedValue}</Value>

        {symbol && <Symbol>&nbsp;{formattedSymbol}</Symbol>}
    </Container>
);
```
