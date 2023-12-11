import { JavaScriptTypeBuilder, Static, TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { Mixin } from 'ts-mixer';

import { ArrayBufferBuilder, BufferBuilder, KeyofEnumBuilder, UintBuilder } from './custom-types';

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

export const Type = new CustomTypeBuilder();
export type { Static };
