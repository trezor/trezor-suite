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
    makeFormatter<
        CryptoAmountFormatterInputValue,
        CryptoAmountFormatterOutputType,
        string,
        CryptoAmountFormatterDataContext
        >(
        (value, dataContext, outputFormat) => {
            const { symbol, isBalance, signValue } = dataContext;
            const { locale, areSatsDisplayed } = config;

            // the rest functionality of your formatter...

            // ...and return formatted value based on requested output format
            switch (outputFormat) {
                case 'primitive':
                    return formattedValue as string;
                case 'structured': {
                    return {
                        formattedSignValue: signValue,
                        formattedValue,
                        formattedSymbol,
                    } as CryptoAmountStructuredOutput;
                }
                case 'default': {
                    const displayedSignValue = signValue
                        ? `${isSignValuePositive(signValue) ? '+' : '-'}`
                        : '';

                    return `${displayedSignValue} ${formattedValue} ${formattedSymbol}` as string;
                }
                default:
            }

            return value as CryptoAmountFormatterInputValue;
```

### Usage

-   all formatters can be accessed with hook `useFormatters()`

```typescript
const { cryptoAmountFormatter } = useFormatters();
```

and used in components:

```typescript
// output as a string, mostly for compatability with graphs
if (isRawString) {
    return <>{cryptoAmountFormatter.format(value, { symbol, isBalance, signValue })}</>;
}

// output as a component - data obtained as the object with a type of your choice...
const cryptoAmountStructure = cryptoAmountFormatter.formatAsStructure(value, {
    symbol,
    isBalance,
    signValue,
}) as CryptoAmountStructuredOutput;
const { formattedSignValue, formattedValue, formattedSymbol } = cryptoAmountStructure;

return (
    <Container className={className}>
        {formattedSignValue && <Sign value={formattedSignValue} />}

        <Value data-test={dataTest}>{formattedValue}</Value>

        {symbol && <Symbol>&nbsp;{formattedSymbol}</Symbol>}
    </Container>
);
```
