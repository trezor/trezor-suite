import { JavaScriptTypeBuilder, Static, TSchema, TObject, Optional } from '@sinclair/typebox';
import { Value, ValueErrorType } from '@sinclair/typebox/value';
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
    try {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        Assert(schema, value);
        return true;
    } catch (e) {
        return false;
    }
}

export function Assert<T extends TSchema>(schema: T, value: unknown): asserts value is Static<T> {
    const errors = [...Value.Errors(schema, value)];
    let [error] = errors;
    while (error) {
        if (error.path === '/' && errors.length > 1) {
            // This might be a nested error, try to find the root cause
        } else if (error.value == null && error.schema[Optional] === 'Optional') {
            // Optional can also accept null values
        } else if (error.type === ValueErrorType.Union) {
            // Drill down into the union
            const currentValue = error.value;
            const hasValidMember = error.schema.anyOf.find((unionSchema: TSchema) =>
                Validate(unionSchema, currentValue),
            );
            if (!hasValidMember) throw new InvalidParameter(error.message, error.path, error.value);
        } else {
            throw new InvalidParameter(error.message, error.path, error.value);
        }
        errors.shift();
        [error] = errors;
    }
}

export const Type = new CustomTypeBuilder();
export { Optional };
export type { Static, TObject, TSchema };
