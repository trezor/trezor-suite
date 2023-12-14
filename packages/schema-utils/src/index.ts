import { JavaScriptTypeBuilder, Static, TSchema, TObject, Optional } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { Mixin } from 'ts-mixer';

import { ArrayBufferBuilder, BufferBuilder, KeyofEnumBuilder, UintBuilder } from './custom-types';
import { InvalidParameter } from './errors';

class CustomTypeBuilder extends Mixin(
    JavaScriptTypeBuilder,
    ArrayBufferBuilder,
    BufferBuilder,
    KeyofEnumBuilder,
    UintBuilder,
) {}

export function Validate<T extends TSchema>(schema: T, value: unknown): value is Static<T> {
    return Value.Check(schema, value);
}
export function Assert<T extends TSchema>(schema: T, value: unknown): asserts value is Static<T> {
    const errors = Value.Errors(schema, value);
    const error = errors.First();
    if (error) {
        if (error.value == null && error.schema[Optional] === 'Optional') {
            // Optional can also accept null values
            return;
        }
        throw new InvalidParameter(error.message, error.path, error.value);
    }
}

export const Type = new CustomTypeBuilder();
export { Optional };
export type { Static, TObject };
