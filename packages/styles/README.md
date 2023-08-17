# @trezor/styles

Fully fledged library to provide best DX for writing styles. In core it uses library `fela` which seems like a good choice for quality, simplicity, performance. I strongly recommend reading [Fela docs](https://fela.js.org/docs/latest/intro/getting-started), especially sections [Motivation](https://fela.js.org/docs/latest/intro/motivation) and [Principles](https://fela.js.org/docs/latest/intro/principles). Big thanks to [wafflepie](https://github.com/wafflepie) for birth of this lib and inspiration.

## Motivation and benefits

1. Platform and framework agnostic - This lib is platform agnostic and can be used with small effort nearly everywhere and with anything.
1. Easy setup - There is no additional setup or plugin needed for your editor, compiler, linter...
1. Strongly typed in TypeScript - Whole library + package `@trezor/theme` is strongly typed, so it will prevent many bugs (forgetting units, invalid property names...). Another benefit of strong types is perfectly working autocomplete and IntelliSense.
1. Natural syntax - Based on standard JS object syntax, very similar to React Native. This allows library to use full potential of CSS-in-JS without compromises (like ugly mixins etc.).
1. Fast and small - Minimal bundle size and very high performance.
1. Great developer experience - Created with DX as main focus point. Perfectly working IntelliSense, every util just one param away with minimum need of extra imports, clean declarative syntax for dynamic conditional styles, RTL support, code snippets...

## Installation

```tsx
import { createRenderer, StylesProvider } from '@trezor/styles';
import { defaultTheme } from '@trezor/theme';
import MyApp from './MyApp';

const renderer = createRenderer();

export default () => (
    <StylesProvider renderer={renderer} theme={defaultTheme}>
        <MyApp />
    </StylesProvider>
);
```

## Usage

### Basic usage in component

```tsx
const myButtonStyle = prepareStyle(() => ({
    cursor: 'pointer',
    width: '100px',
}));

export const MyButton = () => {
    const { applyStyle } = useStyles();

    return <div className={applyStyle(myButtonStyle)}>Hello world</div>;
};
```

### With theme

```tsx
const myButtonStyle = prepareStyle(utils => ({
    cursor: 'pointer',
    width: '100px',
    color: utils.colors.red,
}));

export const MyButton = () => {
    const { applyStyle } = useStyles();

    return <div className={applyStyle(myButtonStyle)}>Hello world</div>;
};
```

### Dynamic styles

You can pass any value you need to your styles.

```tsx
type MyButtonProps = {
    buttonColor: string;
};

type MyButtonStyleProps = MyButtonProps;

const myButtonStyle = prepareStyle<MyButtonStyleProps>((utils, { buttonColor }) => ({
    cursor: 'pointer',
    width: '100px',
    color: buttonColor,
}));

export const MyButton = ({ buttonColor }: MyButtonProps) => {
    const { applyStyle } = useStyles();

    return <div className={applyStyle(myButtonStyle, { buttonColor })}>Hello world</div>;
};
```

### Selectors

```tsx
const myButtonStyle = prepareStyle(utils => ({
    cursor: 'pointer',
    width: '100px',
    selectors: {
        '&:hover': {
            color: utils.colors.red,
        },
    },
}));
```

### Media queries

First approach is useful when you need to change only a single value. Following code will set `color` to red when going from `xs` to `md`. From `md` higher the color will stay the same.

```tsx
const myButtonStyle = prepareStyle(utils => ({
    cursor: 'pointer',
    width: '100px',
    color: { xs: utils.colors.red, md: utils.colors.blue },
}));
```

Second approach is useful when you want to set more than one value. Following code will work exactly same as previous example, but you can define more than one property.

```tsx
const myButtonStyle = prepareStyle(utils => ({
    cursor: 'pointer',
    width: '100px',
    color: utils.colors.red
    selectors: {
        [utils.breakpoints.md]: {
            color: utils.colors.blue,
            width: '200px'
        },
    },
}));
```

### Dynamic conditional styles

There is plenty of options for conditional dynamic styling. First and simplest approach is to use plain inline condition, useful when you need to modify just one property.

```tsx
type MyButtonStyleProps = {
    isBigBlueButton: boolean;
};

const myButtonStyle = prepareStyle<MyButtonStyleProps>((utils, { isBigBlueButton }) => ({
    cursor: 'pointer',
    width: '100px',
    color: isBigBlueButton ? colors.blue : colors.red,
}));

export const MyButton = () => {
    const { applyStyle } = useStyles();
    const isBigBlueButton = true;

    return <div className={applyStyle(myButtonStyle, { isBigBlueButton })}>Hello world</div>;
};
```

Second most common approach is special declarative `extend` syntax. Useful when need to conditionally declare multiple properties.

```tsx
type MyButtonStyleProps = {
    isBigBlueButton: boolean;
};

const myButtonStyle = prepareStyle<MyButtonStyleProps>((utils, { isBigBlueButton }) => ({
    cursor: 'pointer',
    width: '100px',
    color: colors.red,
    extend: {
        condition: isBigBlueButton,
        style: {
            color: utils.colors.blue,
        },
    },
}));
```

Extend property could be single object of array of objects:

```tsx
type MyButtonStyleProps = {
    isBlueButton: boolean;
    size: 'big' | 'small';
};

const myButtonStyle = prepareStyle<MyButtonStyleProps>((utils, { isBlueButton, size }) => ({
    cursor: 'pointer',
    width: '100px',
    color: colors.red,
    extend: [
        {
            condition: isBlueButton,
            style: {
                color: utils.colors.blue,
            },
        },
        {
            condition: size === 'big',
            style: {
                width: '200px',
            },
        },
    ],
}));
```

Also don't forget that you style is plain JS function that returns object so feel free to do any JS magic here. Only avoid heavy calculations here, because it could affect performance.

```tsx
type MyButtonStyleProps = {
    isBigBlueButton: boolean;
};

const myButtonStyle = prepareStyle<MyButtonStyleProps>((utils, { isBigBlueButton }) => {
    if (isBigBlueButton) {
        return {
            color: utils.colors.blue,
        };
    }

    return {
        color: utils.colors.red,
    };
});
```

## Advanced usage

### prepareStyleFactory

```tsx
// TODO prepareStyleFactory
```

### mergeStyles

## Utils

Some useful functions are available in utils. Utils is first param of `prepareStyle` or they are returned from `useStyles` hook.

### getValueAndUnit

```tsx
const { utils } = useStyles();
const [value, unit] = getValueAndUnit('20px'); // => [20, 'px']
```

### multiply

```tsx
multiply(0.5, '100%'); // => 50%
```

### sum

```tsx
sum(['2rem', '3rem']); // => 5rem
```

### negative

```tsx
negative(5); // => -5
```

## Utils from polished

Some of the utils like `darken`, `lighten`, `transparentize` are just reexported from [polished](https://github.com/styled-components/polished) for best experience a to have everything in one place like our custom utils mentioned before.

## Styling in React Native

All examples here were for web usage, but there is only few differences:

1. Use `prepareNativeStyle` instead of `prepareStyle` - this will provide you with the best TS experience because it will autocomplete only properties that are available for RN
1. Use `applyNativeStyle` instead of `applyStyle`
1. Do not use selectors or media queries - these are not supported in React Native and TS won't allow you to do that anyway
