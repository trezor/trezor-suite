import TrezorConnect from '@trezor/connect-web';
import { setDeepValue } from '@trezor/schema-utils/src/utils';

import { Field, FieldBasic } from '../types';

export interface MethodState {
    name?: keyof typeof TrezorConnect;
    submitButton?: string;
    fields: Field<unknown>[];
    params: Record<string, unknown>;
    response?: unknown;
    javascriptCode?: string;
    addressValidation?: boolean;
}

export const initialState: MethodState = {
    name: undefined,
    submitButton: undefined,
    fields: [],
    params: {},
    javascriptCode: undefined,
    response: undefined,
    addressValidation: false,
};

// Converts the fields into a params object
export const getParam = (field: FieldBasic<any>, $params: Record<string, any> = {}) => {
    const params = $params;
    if (field.omit) {
        return params;
    }
    if (field.optional && ((!field.value && field.value !== 0) || field.value === '')) {
        return params;
    }

    let value: any;
    if ('defaultValue' in field) {
        if (field.defaultValue !== field.value) {
            value = field.value;
        }
    } else if (field.type === 'json') {
        try {
            if (typeof field.value === 'string') {
                if (field.value.length > 0) {
                    value = JSON.parse(field.value);
                } else {
                    value = undefined;
                }
            } else {
                value = field.value;
            }
        } catch (error) {
            value = `Invalid json, ${error.toString()}`;
        }
    } else if (field.type === 'function') {
        try {
            if (typeof field.value !== 'function') {
                throw new Error('Invalid function');
            }
            value = field.value;
        } catch (error) {
            value = `Invalid function, ${error.toString()}`;
        }
    } else if (field.type === 'number') {
        if (!Number.isNaN(Number.parseInt(field.value, 10))) {
            value = Number.parseInt(field.value, 10);
        }
    } else {
        value = field.value;
    }
    if (field.name) {
        setDeepValue(params, field.name.split('.'), value);
    } else {
        return value;
    }

    return params;
};

// Updates the javascript output based on the current params
export const updateJavascript = (state: MethodState) => {
    const code =
        Object.keys(state.params).length > 0
            ? JSON.stringify(
                  state.params,
                  (_, value) => {
                      if (Object.prototype.toString.call(value) === '[object ArrayBuffer]') {
                          return 'ArrayBuffer';
                      }

                      return value;
                  },
                  2,
              )
            : '';

    return {
        ...state,
        javascriptCode: `TrezorConnect.${state.name}(${code});`,
    };
};

// Update params inner function, recursively called for nested fields
export const updateParamsNested = (schema: Field<any>[]) => {
    let params: Record<string, any> = {};
    schema.forEach(field => {
        if (field.type === 'array') {
            const arr: Record<string, any>[] = [];
            field.items?.forEach(batch => {
                const batchParams = updateParamsNested(batch);
                arr.push(batchParams);
            });
            if (arr.length > 0 || !field.optional) {
                setDeepValue(params, field.name?.split('.'), arr);
            }
        } else {
            params = getParam(field, params);
        }
    });

    return params;
};

// Update params in the state
export const updateParams = (state: MethodState) => {
    const params: Record<string, any> = updateParamsNested(state.fields);

    return updateJavascript({
        ...state,
        params,
    });
};

// Set affected values
export const setAffectedValues = (state: MethodState, field: Field<unknown>) => {
    if (!field.affect) return field;

    const data = field.data?.find(d => d.value === field.value);
    if (data && data.affectedValue) {
        const affectedFieldNames = !Array.isArray(field.affect) ? [field.affect] : field.affect;
        const values = !Array.isArray(data.affectedValue)
            ? [data.affectedValue]
            : data.affectedValue;

        let root: Field<any>[] | undefined;
        if (typeof field.key === 'string') {
            const key = field.key.split('-');
            const bundle = state.fields.find(f => f.name === key[0]);
            if (bundle && bundle.type === 'array' && bundle.items) {
                root = bundle.items?.find((_batch, index) => index === Number.parseInt(key[1], 10));
            }
        } else {
            root = state.fields;
        }

        affectedFieldNames.forEach((af, index) => {
            const affectedField = root?.find(f => f.name === af);
            if (affectedField && affectedField.type !== 'array') {
                affectedField.value = values[index];
                if (state.name === 'composeTransaction') {
                    affectedField.value = values;
                }
            }
        });
    } else if (field.affect && typeof field.affect === 'string' && field.value) {
        const affectedField = state.fields.find(f => f.name === field.affect);
        if (affectedField) {
            // @ts-expect-error todo: what is this?
            affectedField.value = field.value;
        }
    }

    return field;
};

// Prepare bundle - set keys for nested fields
export const prepareBundle = (field: Field<unknown>) => {
    if (field.type === 'array') {
        field.items.forEach((batch, index) => {
            batch.forEach(batchField => {
                batchField.key = `${field.name}-${index}`;
                if (field.key) {
                    batchField.key = `${field.key}-${batchField.key}`;
                }
                if (batchField.type === 'array') {
                    prepareBundle(batchField);
                }
            });
        });
    }

    return field;
};
