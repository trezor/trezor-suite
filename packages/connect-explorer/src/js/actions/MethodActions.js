/* @flow */

import { push } from 'connected-react-router';
import TrezorConnect from 'trezor-connect';
import { loadDocs } from './DocsActions';

export const TAB_CHANGE: string = 'method_tab_change';
export const FIELD_CHANGE: string = 'method_field_change';
export const FIELD_DATA_CHANGE: string = 'method_field_data_change';
export const ADD_BATCH: string = 'method_add_batch';
export const REMOVE_BATCH: string = 'method_remove_batch';
export const RESPONSE: string = 'method_response';

export const onTabChange = (tab) => (dispatch, getState) => {
    dispatch({
        type: TAB_CHANGE,
        tab
    });

    if (tab !== 'docs') return;
    dispatch(loadDocs());
}

export const onFieldChange = (field, value) => {
    return {
        type: FIELD_CHANGE,
        field,
        value
    }
}

export const onFieldDataChange = (field, data) => {
    return {
        type: FIELD_DATA_CHANGE,
        field,
        data
    }
}

export const onBatchAdd = (field, item) => {
    return {
        type: ADD_BATCH,
        field,
        item
    }
}

export const onBatchRemove = (field, batch) => {
    return {
        type: REMOVE_BATCH,
        field,
        batch,
    }
}

export const onSubmit = () => async (dispatch, getState) => {
    const { method } = getState();
    const connectMethod = TrezorConnect[method.name];
    if (typeof connectMethod !== 'function') {
        dispatch(onResponse({
            error: `Method "${connectMethod}" not found in TrezorConnect`
        }));
        return;
    }

    const response = await connectMethod({
        ...method.params,
    });

    dispatch(onResponse(response));
}

export const onResponse = (response) => {
    return {
        type: RESPONSE,
        response
    }
}


export const onVerify = (url: string) => async (dispatch, getState) => {
    const { method } = getState();
    const verifyMethodValues = {
        address: method.response.payload.address,
        signature: method.response.payload.signature,
        coin: method.params.coin,
        message: method.params.message,
    }

    // ethereum extra field
    if (method.params.hasOwnProperty('hex')) {
        verifyMethodValues.hex = method.params.hex;
    }

    // lisk extra field
    if (method.response.payload.publicKey) {
        verifyMethodValues.publicKey = method.response.payload.publicKey;
    }

    await dispatch(push(url));

    const verifyMethod = getState().method;
    verifyMethod.fields.forEach(async (f) => {
        if (verifyMethodValues[f.name]) {
            await dispatch(onFieldChange(f, verifyMethodValues[f.name]));
        }
    });
}

