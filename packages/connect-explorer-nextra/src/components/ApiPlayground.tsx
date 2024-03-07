import React, { useEffect } from 'react';

import styled from 'styled-components';
import { Optional, Kind, TSchema } from '@sinclair/typebox';

import { Card, CollapsibleBox, variables } from '@trezor/components';

import { Method } from './Method';
import { useActions } from '../hooks';
import * as methodActions from '../actions/methodActions';

const ApiPlaygroundWrapper = styled(Card)`
    display: block;
    position: fixed;
    z-index: 50;
    bottom: 2rem;
    left: 2rem;
    right: 2rem;
    max-width: 54rem;
    max-height: 48rem;
    overflow-x: auto;
    border-radius: 1rem;
    padding: 0;
    border: 1px solid ${({ theme }) => theme.STROKE_GREY};
    box-shadow: ${({ theme }) => theme.boxShadowElevated};

    @media (min-width: ${variables.SCREEN_SIZE.LG}) {
        left: 18rem;
    }

    @media (min-width: 90rem) {
        left: calc(50% - 27rem);
    }
`;

const schemaToFields = (schema: TSchema) => {
    console.log(schema);

    if (schema[Kind] === 'Object') {
        return Object.keys(schema.properties).flatMap(key => {
            const field = schema.properties[key];
            if (field[Kind] === 'Object') {
                return [
                    {
                        name: key,
                        label: key,
                        type: 'json',
                        value: undefined,
                    },
                ];
            }

            return schemaToFields(field).map(field => {
                return {
                    ...field,
                    name: [key, field.name].filter(v => v).join('.'),
                };
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
        const onlyLiterals = schema.anyOf?.every(s => s[Kind] === 'Literal');
        if (onlyLiterals) {
            const filtered = schema.anyOf?.filter((s, i) => s.const !== i.toString());
            const options = filtered.length > 0 ? filtered : schema.anyOf;

            return [
                {
                    type: 'select',
                    value: schema.default,
                    optional: schema[Optional] === 'Optional',
                    data: options.map(s => ({ label: s.const, value: s.const })),
                },
            ];
        }
    }

    const typeMap: Record<string, string> = {
        String: 'input',
        Number: 'number',
        Uint: 'number',
        Boolean: 'checkbox',
    };

    return [
        {
            type: typeMap[schema[Kind]] ?? 'input',
            value: schema.default,
            optional: schema[Optional] === 'Optional',
        },
    ];
};

interface ApiPlaygroundProps {
    method: string;
    schema: TSchema;
}
export const ApiPlayground = ({ method, schema }: ApiPlaygroundProps) => {
    const actions = useActions({
        onSetMethod: methodActions.onSetMethod,
    });
    useEffect(() => {
        const fields = schemaToFields(schema);
        actions.onSetMethod({
            name: method,
            fields,
            submitButton: 'Submit',
        });
    }, [actions, method, schema]);

    return (
        <ApiPlaygroundWrapper>
            <CollapsibleBox heading="Method testing tool" variant="large">
                <Method />
            </CollapsibleBox>
        </ApiPlaygroundWrapper>
    );
};
