import {
    Hint,
    JavaScriptTypeBuilder,
    type SchemaOptions,
    type TEnum,
    type TEnumKey,
    type TEnumValue,
    type TKeyOf,
    type TNull,
    type TObject,
} from '@sinclair/typebox';

import { typedObjectFromEntries, typedObjectKeys } from '@trezor/utils';

type TKeyOfEnumObject<T extends Record<string, string | number>> = TObject<{
    [Key in Extract<keyof T, string>]: TNull;
}>;

export type TKeyOfEnum<T extends Record<string, string | number>> = TKeyOf<TKeyOfEnumObject<T>> & {
    [Hint]: 'KeyOfEnum';
};

export class KeyofEnumBuilder extends JavaScriptTypeBuilder {
    KeyOfEnum<T extends Record<string, string | number>>(
        schema: T,
        options?: SchemaOptions,
    ): TKeyOfEnum<T> {
        const properties = typedObjectFromEntries(
            typedObjectKeys(schema).map(key => [key, this.Null()]),
        );

        return this.KeyOf(this.Object(properties), {
            ...options,
            [Hint]: 'KeyOfEnum',
        }) as TKeyOfEnum<T>;
    }

    Enum<V extends TEnumValue, T extends Record<TEnumKey, V>>(
        schema: T,
        options?: SchemaOptions,
    ): TEnum<T> {
        const anyOf = Object.entries(schema)
            .filter(([key, _value]) => typeof key === 'string' || !isNaN(key))
            .map(([key, value]) => this.Literal(value, { $id: key }));

        return this.Union(anyOf, { ...options, [Hint]: 'Enum' }) as TEnum<T>;
    }
}
