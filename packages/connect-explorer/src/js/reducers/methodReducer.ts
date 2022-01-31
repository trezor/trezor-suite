/* eslint-disable no-eval */

import stringifyObject from 'stringify-object';

import {
    TAB_CHANGE,
    FIELD_CHANGE,
    FIELD_DATA_CHANGE,
    ADD_BATCH,
    REMOVE_BATCH,
    RESPONSE,
} from '../actions/methodActions';
import { ON_LOCATION_CHANGE } from '../actions';
import config from '../data/methods/index';
import type { Action, Field, FieldWithBundle } from '../types';

export interface MethodState {
    name?: string;
    url?: string;
    description?: string;
    submitButton: any;
    fields: (Field<any> | FieldWithBundle<any>)[];
    params: any;
    tab: string;
    javascriptCode?: string;
    response?: any;
    addressValidation?: boolean;
    docs?: string;
}

const initialState: MethodState = {
    name: undefined,
    url: undefined,
    description: undefined,
    submitButton: null,
    fields: [],
    params: {},
    tab: 'code',
    javascriptCode: undefined,
    response: undefined,
    addressValidation: false,
    docs: undefined,
};

const getParam = (field: Field<any>, $params: Record<string, any> = {}) => {
    const params = $params;
    if (field.omit) {
        return params;
    }
    if (field.optional && ((!field.value && field.value !== 0) || field.value === '')) {
        return params;
    }
    if ('defaultValue' in field) {
        if (field.defaultValue !== field.value) {
            params[field.name] = field.value;
        }
    } else if (field.type === 'json') {
        try {
            params[field.name] = field.value.length > 0 ? eval(`(${field.value});`) : '';
        } catch (error) {
            params[field.name] = `Invalid json, ${error.toString()}`;
        }
    } else if (field.type === 'function') {
        try {
            params[field.name] = field.value.length > 0 ? eval(`(${field.value});`) : '';
        } catch (error) {
            params[field.name] = `Invalid function, ${error.toString()}`;
        }
    } else if (field.type === 'number') {
        if (!Number.isNaN(Number.parseInt(field.value, 10))) {
            params[field.name] = Number.parseInt(field.value, 10);
        }
    } else {
        params[field.name] = field.value;
    }
    return params;
};

const updateJavascript = (state: MethodState) => {
    const code =
        Object.keys(state.params).length > 0
            ? stringifyObject(state.params, {
                  indent: '  ',
                  singleQuotes: false,
                  transform: (obj, prop, originalResult) => {
                      if (Object.prototype.toString.call(obj[prop]) === '[object ArrayBuffer]') {
                          return 'ArrayBuffer';
                      }
                      return originalResult;
                  },
              })
            : '';

    return {
        ...state,
        javascriptCode: `TrezorConnect.${state.name}(${code});`,
    };
};

const updateParams = (state: MethodState) => {
    const params: Record<string, any> = {};
    state.fields.forEach(field => {
        if (field.type === 'array') {
            const arr: Record<string, any>[] = [];
            field.items?.forEach(batch => {
                const batchParams = {};
                batch.forEach(batchField => {
                    getParam(batchField, batchParams);
                });
                arr.push(batchParams);
            });
            params[field.name] = arr;
        } else {
            getParam(field, params);
        }
    });

    return updateJavascript({
        ...state,
        params,
    });
};

const setAffectedValues = (state: MethodState, field: any) => {
    if (!field.affect) return field;

    const data = field.data?.find(d => d.value === field.value);
    if (data && data.affectedValue) {
        const affectedFieldNames = !Array.isArray(field.affect) ? [field.affect] : field.affect;
        const values = !Array.isArray(data.affectedValue)
            ? [data.affectedValue]
            : data.affectedValue;

        let root;
        if (typeof field.key === 'string') {
            const key = field.key.split('-');
            const bundle = state.fields.find(f => f.name === key[0]);
            if (bundle) {
                root = bundle.items?.find((batch, index) => index === Number.parseInt(key[1], 10));
            }
        } else {
            root = state.fields;
        }

        affectedFieldNames.forEach((af, index) => {
            const affectedField = root.find(f => f.name === af);
            if (affectedField) {
                affectedField.value = values[index];
            }
        });
    } else if (field.affect && typeof field.affect === 'string' && field.value) {
        const affectedField = state.fields.find(f => f.name === field.affect);
        if (affectedField) {
            // @ts-ignore todo: what is this?
            affectedField.value = field.value;
        }
    }

    return field;
};

const prepareBundle = (field: any) => {
    if (field.type === 'array') {
        field.items!.forEach((batch, index) => {
            batch.forEach(batchField => {
                batchField.key = `${field.name}-${index}`;
            });
        });
    }
    return field;
};

const findField = (state: MethodState, field: any) => {
    if (typeof field.key === 'string') {
        const key = field.key.split('-');
        const bundle = state.fields.find(f => f.name === key[0]);
        const batch = bundle?.items?.find((batch, index) => index === Number.parseInt(key[1], 10));
        return batch.find(f => f.name === field.name);
    }
    return state.fields.find(f => f.name === field.name);
};

const onFieldChange = (state: MethodState, _field: any, value: any) => {
    const newState = {
        ...JSON.parse(JSON.stringify(state)),
        ...state,
    };
    const field = findField(newState, _field);
    field.value = value;
    if (field.affect) {
        setAffectedValues(newState, field);
    }
    return updateParams(newState);
};

const onFieldDataChange = (state: MethodState, _field: any, data: any) => {
    const newState = state;
    const field = findField(newState, _field);
    field.data = data;
    return updateParams(newState);
};

// initialization
const getMethodState = (url: string) => {
    // find data in config
    const method = config.find(m => m.url === url);
    if (!method) return initialState;
    // clone object
    const state = {
        ...JSON.parse(JSON.stringify(method)),
        // ...method,
    };

    // set default values
    state.fields = state.fields.map(f => setAffectedValues(state, prepareBundle(f)));
    state.tab = initialState.tab;
    // set method params
    return updateParams(state);
};

const onAddBatch = (state: MethodState, _field: Field<any>, item: any) => {
    const newState = JSON.parse(JSON.stringify(state));
    const field = newState.fields.find(f => f.name === _field.name);
    field.items = [...field.items, item];
    prepareBundle(field);

    return updateParams(newState);
};

const onRemoveBatch = (state: MethodState, _field: any, _batch: any) => {
    const field = state.fields.find(f => f.name === _field.name);
    const items = field?.items?.filter(batch => batch !== _batch);

    const newState = JSON.parse(JSON.stringify(state));
    const newField = newState.fields.find(f => f.name === field?.name);
    newField.items = items;
    prepareBundle(newField);

    return updateParams(newState);
};

export default function method(state: MethodState = initialState, action: Action) {
    switch (action.type) {
        case ON_LOCATION_CHANGE:
            return getMethodState(action.payload.pathname);

        case TAB_CHANGE:
            return {
                ...state,
                tab: action.tab,
            };

        case FIELD_CHANGE:
            return onFieldChange(state, action.field, action.value);

        case FIELD_DATA_CHANGE:
            return onFieldDataChange(state, action.field, action.data);

        case ADD_BATCH:
            return onAddBatch(state, action.field, action.item);

        case REMOVE_BATCH:
            return onRemoveBatch(state, action.field, action.batch);

        case RESPONSE:
            return {
                ...state,
                tab: 'response',
                response: action.response,
            };
        default:
            return state;
    }
}
