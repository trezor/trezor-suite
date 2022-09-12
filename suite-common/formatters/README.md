# @suite-common/formatters

This package provides utility functions to format values in your React components.

A formatter is an object with a `format` method. Formatters should be created solely using the makeFormatter factory.

The simplest formatter looks like:

```typescript
const upperCaseFormatter = makeFormatter(value => value.toUpperCase())
upperCaseFormatter.format("foo") // "FOO"
```

Our formatters are defined in `src/FormatterProvider.tsx`:

```typescript
    const contextValue = useMemo(
        () => ({
            cryptoAmountFormatter: prepareCryptoAmountFormatter(config),
        }),
        [config, intl],
    );
```

...prepared with generator functions (`src/generators.ts`):

```typescript
export const prepareCryptoAmountFormatter = (config: FormatterConfig) =>
    makeFormatter<CryptoAmountFormatterInputType, CryptoAmountFormatterOutputType>(
        (value, suggestions) => {
            const { amount, symbol, isBalance, signValue } = value;
            const { locale, areSatsDisplayed } = config;

            // the rest functionality of your formatter...

            // ...and return formatted value in the end
            return `${formattedSignValue} ${formattedValue} ${formattedSymbol}`;
```

### Usage

```typescript
const { cryptoAmountFormatter } = useFormatters();

const formatterInput = { amount: value, symbol, isBalance, signValue };

// output as a string, mostly for compatability with graphs
return <>{cryptoAmountFormatter.format(formatterInput)}</>

// output as a component - data obtained as the object with a type of your choice...
const cryptoAmountStructure = cryptoAmountFormatter.formatAsStructure(formatterInput) as CryptoAmountStructuredOutput;
const { formattedSignValue, formattedValue, formattedSymbol } = cryptoAmountStructure;

return (
    <Container className={className}>
        {formattedSignValue && <Sign value={formattedSignValue} />}

        <Value data-test={dataTest}>{formattedValue}</Value>

        {symbol && <Symbol>&nbsp;{formattedSymbol}</Symbol>}
    </Container>
);
```

### Usage Context

Although formatters can render icons or custom translation components, we often need to access primitive data instead of React elements.

This is where usage suggestions come into play. Suggestions can be used to tell formatters that a value needs to be rendered with some special care. For example, pass `"primitive"` to tell a formatter that it should return a primitive value, such as a string.

```typescript
const booleanFormatter = makeFormatter((value, suggestions) => {
  if (suggestions.includes("primitive")) {
    return value ? "True" : "False"
  }

  return <Icon type={value ? "success" : "failure"} />
})

booleanFormatter.format(true) // <Icon type="success" />
booleanFormatter.format(true, ["primitive"]) // "True"
```

All formatters also have the `formatAsPrimitive` method, which automatically passes the `"primitive"` suggestion in addition to all other suggestions.

```typescript
booleanFormatter.formatAsPrimitive(true) // "True"
booleanFormatter.formatAsPrimitive(true, ["abbreviated"]) // "True"
```

Another handy method is `formatAsStructure`, which automatically passes the "structured" suggestion in addition to all other suggestions and returns structured data object.

Big thanks to [wafflepie](https://github.com/wafflepie) for birth of [afformative](https://github.com/wafflepie/afformative) lib and inspiration.
