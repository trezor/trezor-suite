# @trezor/schema-utils

A schema definition and validation library for TypeScript, based on [TypeBox](https://github.com/sinclairzx81/typebox).

## Example usage

### Schema definition

Let's say we have a TypeScript type that we want to convert to a schema.

```typescript
export interface Example {
    coordinator: string;
    coin?: string;
    maxRounds: number;
    maxFeePerKvbyte: Uint;
    data: ArrayBuffer;
    path: DerivationPath;
}
```

The schema for this type can be defined as follows:

```typescript
import { Type, Static } from '@trezor/schema-utils';
// ...

export const Example = Type.Object({
    coordinator: Type.String(),
    coin: Type.Optional(Type.String()),
    maxRounds: Type.Number(),
    maxFeePerKvbyte: Type.Uint(),
    data: Type.ArrayBuffer(),
    path: DerivationPath, // Reference to another schema
});

// Inferred TS type
export type Example = Static<typeof schema>;
```

We can see that primitive and common types are defined using the `Type` object. This is also used for constructs such as unions, intersects, etc. The full list of available types can be found in the [TypeBox documentation](https://github.com/sinclairzx81/typebox/blob/master/readme.md)

If done correctly, the new schema should be equivalent to the old TypeScript type.
Since the inferred TypeScript type is exported with the same name, it can be used both as a type and for runtime validation.

### Validation

We have two main functions for validation: `Assert` and `Validate`.

Assert throws an error if the payload does not match the schema, also functioning as a type assertion.

```typescript
import { Assert } from '@trezor/schema-utils';

Assert(Example, payload);
// payload now must be of type Example
```

Validate does not throw, but simply returns a boolean. It can also be used as a type guard.

```typescript
import { Validate } from '@trezor/schema-utils';

if (Validate(Example, payload)) {
    // payload now must be of type Example
}
```

## Code generation

To generate schemas from TypeScript types automatically, you can use the code generation tool.

```bash
yarn workspace @trezor/schema-utils codegen <file>
```

This tool is also used in Protobuf code generation to generate schemas for the messages.

## Custom types

There are a few behavior changes and custom types that are used in the schemas.

### Enums

```typescript
enum MyExample {
    Foo = 'foo',
    Bar = 'bar',
}

const EnumMyExample = Type.Enum(MyExample);
```

To use an enum as a schema, you need to use the `Type.Enum` function.
The convention is to prefix the name of the schema with `Enum`.
That way, the original enum can be used as a TypeScript type, and the schema can be used for validation.

To get the schema for the keys of the enum, you can use the `KeyOfEnum` type. The parameter it takes is directly the original Enum, not the schema. Don't use Typebox's `Type.KeyOf` function for this, as it will not work correctly.

```typescript
const MyExampleKey: Type.KeyOfEnum(MyExample);
```

### Uint

```typescript
Type.Uint();

// Can also be used for Sint
Type.Uint({ allowNegative: true });
```

The `Uint` type is a custom type that is used in the Protobuf messages.
It is a unsigned integer that can be represented as a string or a number.
By using the `allowNegative` option, it can also be used for signed integers.

### ArrayBuffer and Buffer

```typescript
Type.ArrayBuffer();
Type.Buffer();
```

Instances of the `ArrayBuffer` JS built-in object and `Buffer` in Node.js.
