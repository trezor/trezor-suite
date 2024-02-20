import TrezorConnect from '@trezor/connect-web';
import { loadDocs } from './docsActions';

import { GetState, Dispatch, Field } from '../types';

export const TAB_CHANGE = 'method_tab_change';
export const FIELD_CHANGE = 'method_field_change';
export const FIELD_DATA_CHANGE = 'method_field_data_change';
export const ADD_BATCH = 'method_add_batch';
export const REMOVE_BATCH = 'method_remove_batch';
export const RESPONSE = 'method_response';

export type MethodAction =
    | { type: typeof TAB_CHANGE; tab: string }
    | { type: typeof FIELD_CHANGE; field: Field<any>; value: any }
    | { type: typeof FIELD_DATA_CHANGE; field: Field<any>; data: any }
    | { type: typeof ADD_BATCH; field: Field<any>; item: any }
    | { type: typeof REMOVE_BATCH; field: Field<any>; batch: any[] }
    | { type: typeof RESPONSE; response: any };

export const onTabChange = (tab: string) => (dispatch: Dispatch) => {
    dispatch({
        type: TAB_CHANGE,
        tab,
    });

    if (tab !== 'docs') return;
    dispatch(loadDocs());
};

export const onFieldChange = (field: Field<any>, value: any) => ({
    type: FIELD_CHANGE,
    field,
    value,
});

export const onFieldDataChange = (field: Field<any>, data: any) => ({
    type: FIELD_DATA_CHANGE,
    field,
    data,
});

export const onBatchAdd = (field: Field<any>, item: any) => ({
    type: ADD_BATCH,
    field,
    item,
});

export const onBatchRemove = (field: Field<any>, batch: any) => ({
    type: REMOVE_BATCH,
    field,
    batch,
});

export const onResponse = (response: any) => ({
    type: RESPONSE,
    response,
});

export const onSubmit = () => async (dispatch: Dispatch, getState: GetState) => {
    const { method } = getState();
    if (!method?.name) throw new Error('method name not specified');

    const connectMethod = TrezorConnect[method.name];
    if (typeof connectMethod !== 'function') {
        dispatch(
            onResponse({
                error: `Method "${connectMethod}" not found in TrezorConnect`,
            }),
        );

        return;
    }

    const response = await connectMethod({
        ...method.params,
    });

    dispatch(onResponse(response));
};

export const onVerify = () => (dispatch: Dispatch, getState: GetState) => {
    const { method } = getState();
    if (!method) throw new Error('method not specified');

    const verifyMethodValues = {
        address: method.response.payload.address,
        signature: method.response.payload.signature,
        coin: method.params.coin,
        message: method.params.message,
        hex: undefined,
        publicKey: undefined,
    };

    // ethereum extra field
    if ('hex' in method.params) {
        verifyMethodValues.hex = method.params.hex;
    }

    const verifyMethod = getState().method;
    verifyMethod?.fields.forEach((f: any) => {
        if (verifyMethodValues[f.name]) {
            dispatch(onFieldChange(f, verifyMethodValues[f.name]));
        }
    });
};
