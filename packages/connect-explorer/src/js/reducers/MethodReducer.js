/* @flow */

import { UI } from 'trezor-connect';
import { LOCATION_CHANGE } from 'connected-react-router';
import stringifyObject from 'stringify-object';
import {
    TAB_CHANGE,
    FIELD_CHANGE,
    FIELD_DATA_CHANGE,
    ADD_BATCH,
    REMOVE_BATCH,
    RESPONSE 
} from '../actions/MethodActions';
import config from '../data/methods/index';

const initialState = {
    name: undefined,
    url: undefined,
    description: undefined,
    submitButton: null,
    fields: [],
    params: {},
    tab: 'code',
    javascriptCode: null,
    response: null,
    addressValidation: false,
};

const getParam = (field, $params) => {
    const params = $params || {};
    if (field.omit) {
        return params;
    } else if (field.optional && ((!field.value && field.value !== 0) || field.value === '')) {
        return params;
    } else if (field.hasOwnProperty('defaultValue')) {
        if (field.defaultValue !== field.value) {
            params[field.name] = field.value;
        }
    } else if (field.type === 'json') {
        try {
            params[field.name] = field.value.length > 0 ? eval('(' + field.value + ');') : '';
        } catch (error) {
            params[field.name] = `Invalid json, ${ error.toString() }`
        }
    } else if (field.type === 'function') {
        try {
            params[field.name] = field.value.length > 0 ? eval('(' + field.value + ');') : '';
        } catch (error) {
            params[field.name] = `Invalid function, ${ error.toString() }`
        }
    } else if (field.type === 'number') {
        if (!isNaN(parseInt(field.value))) {
            params[field.name] = parseInt(field.value);
        }
    } else {
        params[field.name] = field.value;
    }
    return params;
}

const updateParams = (state) => {
    const params = {};
    state.fields.forEach(field => {
        if (field.type === 'array') {
            const arr = [];
            field.items.forEach(batch => {
                const batchParams = {};
                batch.forEach(batchField => {
                    getParam(batchField, batchParams);
                })
                arr.push(batchParams);
            })
            params[field.name] = arr;
        } else {
            getParam(field, params);
        }
    });

    return updateJavascript({
        ...state,
        params
    });
};

const updateJavascript = (state) => {
    const code = Object.keys(state.params).length > 0 ? stringifyObject(state.params, {
        indent: '  ',
        singleQuotes: false,
        transform: (obj, prop, originalResult) => {
            if (Object.prototype.toString.call(obj[prop]) === '[object ArrayBuffer]') {
                return 'ArrayBuffer';
            } else {
                return originalResult;
            }
        }
    }) : '';

    return {
        ...state,
        javascriptCode: `TrezorConnect.${state.name}(${code});`,
    }
}

const setAffectedValues = (state, field) => {
    if (!field.affect) return field;

    const data = field.data.find(d => d.value === field.value);
    if (data && data.affectedValue) {
        const affectedFieldNames = !Array.isArray(field.affect) ? [ field.affect ] : field.affect;
        const values = !Array.isArray(data.affectedValue) ? [ data.affectedValue ] : data.affectedValue;
        

        let root;
        if (typeof field.key === 'string') {
            const key = field.key.split('-');
            const bundle = state.fields.find(f => f.name === key[0]);
            root = bundle.items.find((batch, index) => index === parseInt(key[1]));
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
        affectedField.value = field.value;
    }

    return field;
};

const prepareBundle = (field) => {
    if (field.type === 'array') {
        field.items.forEach((batch, index) => {
            batch.forEach(batchField => {
                batchField.key = `${field.name}-${index}`;
            })
        })
    }
    return field;
}

const findField = (state, field) => {
    if (typeof field.key === 'string') {
        const key = field.key.split('-');
        const bundle = state.fields.find(f => f.name === key[0]);
        const batch = bundle.items.find((batch, index) => index === parseInt(key[1]));
        return batch.find(f => f.name === field.name);
    }
    return state.fields.find(f => f.name === field.name);
}

const onFieldChange = (state, action) => {
    const newState = {
        ...JSON.parse(JSON.stringify(state)),
        ...state,
    };
    const field = findField(newState, action.field);
    field.value = action.value;
    if (field.affect) {
        setAffectedValues(newState, field);
    }
    return updateParams(newState);
};

const onFieldDataChange = (state, action) => {
    const newState = state;
    const field = findField(newState, action.field);
    field.data = action.data;
    return updateParams(newState);
};

// initialization
const getMethodState = (url) => {
    // find data in config
    const method = config.find(m => m.url === url);
    if (!method) return initialState;
    // clone object
    const state = {
        ...JSON.parse(JSON.stringify(method)),
        ...method,
    };

    // set default values
    state.fields = state.fields.map(f => setAffectedValues(state, prepareBundle(f)));
    state.tab = initialState.tab;
    // set method params
    return updateParams(state);
};

const onAddBatch = (state, action) => {
    const newState = JSON.parse(JSON.stringify(state));
    const field = newState.fields.find(f => f.name === action.field.name);
    field.items = [
        ...field.items,
        action.item,
    ];
    prepareBundle(field);

    return updateParams(newState);
}

const onRemoveBatch = (state, action) => {
    
    const field = state.fields.find(f => f.name === action.field.name);
    const items = field.items.filter(batch => batch !== action.batch);

    const newState = JSON.parse(JSON.stringify(state));
    const newField = newState.fields.find(f => f.name === action.field.name);
    newField.items = items;
    prepareBundle(newField);

    return updateParams(newState);
}

export default function method(state: ModalState = initialState, action: any): any {

    switch (action.type) {
        case LOCATION_CHANGE:
            return getMethodState(action.payload.location.pathname);

        case TAB_CHANGE:
            return {
                ...state,
                tab: action.tab
            }

        case FIELD_CHANGE:
            return onFieldChange(state, action);
 
        case FIELD_DATA_CHANGE:
            return onFieldDataChange(state, action);

        case ADD_BATCH:
            return onAddBatch(state, action);

        case REMOVE_BATCH:
            return onRemoveBatch(state, action);

        case RESPONSE:
            return {
                ...state,
                tab: 'response',
                response: action.response,
            }

        
        case UI.ADDRESS_VALIDATION:
            return {
                ...state,
                addressValidation: true,
            };

        case UI.CLOSE_UI_WINDOW:
            return {
                ...state,
                addressValidation: false,
            }

        default: return state;
    }
}