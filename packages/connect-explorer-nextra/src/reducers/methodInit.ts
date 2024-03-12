import { Optional, Kind, TSchema } from '@sinclair/typebox';

import type TrezorConnect from '@trezor/connect-web';

import {
    MethodState,
    initialState,
    prepareBundle,
    setAffectedValues,
    updateParams,
} from './methodCommon';
import { Field, FieldBasic } from '../types';

// Convert TypeBox schema to our fields
const schemaToFields = (schema: TSchema): Field<any>[] => {
    if (schema[Kind] === 'Object') {
        return Object.keys(schema.properties).flatMap(key => {
            const field = schema.properties[key];
            /* if (field[Kind] === 'Object') {
                return [
                    {
                        name: key,
                        label: key,
                        type: 'json',
                        value: undefined,
                    },
                ];
            } */

            return schemaToFields(field).map(field => {
                const output = {
                    ...field,
                    name: [key, field.name].filter(v => v).join('.'),
                    optional: field.optional || schema[Optional] === 'Optional',
                };
                // TODO better handle optional parent
                if (output.type === 'array') {
                    if (output.optional) {
                        output.items = [];
                    }
                }

                return output;
            });
        });
    } else if (schema[Kind] === 'Array') {
        const fields = schemaToFields(schema.items);

        return [
            {
                name: '',
                type: 'array',
                batch: [
                    {
                        type: '',
                        fields,
                    },
                ],
                items: schema[Optional] === 'Optional' ? [] : [fields],
            },
        ];
    } else if (schema[Kind] === 'Intersect') {
        return schema.allOf?.flatMap(schemaToFields);
    } else if (schema[Kind] === 'Union') {
        const onlyLiterals = schema.anyOf?.every((s: TSchema) => s[Kind] === 'Literal');
        if (onlyLiterals) {
            const filtered = schema.anyOf?.filter(
                (s: TSchema, i: number) => s.const !== i.toString(),
            );
            const options = filtered.length > 0 ? filtered : schema.anyOf;

            return [
                {
                    name: '',
                    type: 'select',
                    value: schema.default,
                    optional: schema[Optional] === 'Optional',
                    data: options.map((s: TSchema) => ({ label: s.const, value: s.const })),
                },
            ];
        }

        if (schema.anyOf?.length > 0) {
            // TODO complex union handling - currently only first option is used
            return schemaToFields(schema.anyOf[0]).map(field => ({
                ...field,
                optional: field.optional || schema[Optional] === 'Optional',
                value: field.type === 'array' ? undefined : field.value ?? schema.default,
            }));
        } else {
            return [];
        }
    }

    const typeMap: Record<string, FieldBasic<any>['type']> = {
        String: 'input',
        Number: 'number',
        Uint: 'number',
        Boolean: 'checkbox',
    } as const;

    return [
        {
            name: '',
            type: typeMap[schema[Kind]] ?? 'input',
            value: schema.default,
            optional: schema[Optional] === 'Optional',
        },
    ];
};

// Get method state
export const getMethodState = (methodConfig?: Partial<MethodState>) => {
    if (!methodConfig) return initialState;

    // clone object
    const state = {
        ...JSON.parse(JSON.stringify(methodConfig)),
        // ...method,
    } as MethodState;

    // set default values
    state.fields = state.fields.map(f => setAffectedValues(state, prepareBundle(f)));

    console.log('state', state);

    // set method params
    return updateParams(state);
};

// Get method state from TypeBox schema
export const getMethodStateFromSchema = (method: keyof typeof TrezorConnect, schema: TSchema) => {
    return getMethodState({
        name: method,
        fields: schemaToFields(schema),
        submitButton: 'Submit',
    });
};
