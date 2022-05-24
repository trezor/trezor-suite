# @trezor/validation

This package extends [yup](https://github.com/jquense/yup) validation library with custom methods, messages and types. Whenever `yup` is used in Suite, it should be imported from here rather than directly from _yup_. Using `ValidationSchema` enables type check on the schema object.

## Usage

```ts
import { ValidationSchema, yup } from '@trezor/validation';

// providing a type for the schema object for type safety
type MySchema = {
    myField: string;
};

const mySchema =
    yup.object <
    ValidationSchema<MySchema>({
        myField: yup
            .string() // standard yup validation
            .isAscii(), // custom validation including a custom message
    });
```
