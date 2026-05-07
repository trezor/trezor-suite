import type { TSchema } from '@sinclair/typebox';
import JSON5 from 'json5';

import TrezorConnectMobile from '@trezor/connect-mobile';
import TrezorConnect from '@trezor/connect-web';
import { getDeepValue } from '@trezor/schema-utils/src/utils';

import type { Dispatch, Field, GetState } from '../types';
import {
    ADD_BATCH,
    FIELD_CHANGE,
    FIELD_DATA_CHANGE,
    REMOVE_BATCH,
    RESPONSE,
    SET_MANUAL_MODE,
    SET_METHOD,
    SET_METHOD_PROCESSING,
    SET_SCHEMA,
    SET_UNION,
} from '../types/actions';

export const onSetMethod = (methodConfig: any) => ({
    type: SET_METHOD,
    methodConfig,
});

export const onSetSchema = (method: string, schema: TSchema) => ({
    type: SET_SCHEMA,
    method,
    schema,
});

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

export const onSetUnion = (field: Field<any>, current: any) => ({
    type: SET_UNION,
    field,
    current,
});

export const onResponse = (response: any) => ({
    type: RESPONSE,
    response,
});

export const onSetManualMode = (manualMode: boolean) => ({
    type: SET_MANUAL_MODE,
    manualMode,
});

export const onSubmit = () => async (dispatch: Dispatch, getState: GetState) => {
    const { method, connect } = getState();
    if (!method?.name) throw new Error('method name not specified');
    dispatch({ type: SET_METHOD_PROCESSING, payload: true });
    const trezorConnectImpl =
        connect.options?.coreMode === 'deeplink' ? TrezorConnectMobile : TrezorConnect;
    const connectMethod = trezorConnectImpl[method.name];
    if (typeof connectMethod !== 'function') {
        dispatch(
            onResponse({
                error: `Method "${connectMethod}" not found in TrezorConnect`,
            }),
        );

        return;
    }

    // @ts-expect-error params type is unknown
    const response = await connectMethod({
        ...method.params,
    });
    dispatch({ type: SET_METHOD_PROCESSING, payload: false });
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
    } as any;

    // ethereum extra field
    if ('hex' in method.params) {
        verifyMethodValues.hex = method.params.hex;
    }

    method.fields.forEach((f: any) => {
        if (verifyMethodValues[f.name]) {
            dispatch(onFieldChange(f, verifyMethodValues[f.name]));
        }
    });
};

export const onCodeChange = (value: string) => (dispatch: Dispatch, getState: GetState) => {
    try {
        const { fields } = getState().method;
        const parsed = JSON5.parse(value);
        const processField = (field: Field<unknown>) => {
            const valuePath = [...(field.path || []), ...field.name.split('.')].filter(Boolean);
            const value = getDeepValue(parsed, valuePath);

            if (field.type === 'array') {
                // ensure the array has the correct number of items
                if (value) {
                    for (let i = field.items.length; i < value.length; i++) {
                        dispatch(onBatchAdd(field, field.batch[0].fields));
                    }
                    for (let i = field.items.length; i > value.length; i--) {
                        dispatch(onBatchRemove(field, field.items[i - 1]));
                    }
                }

                field.items.forEach(batch => {
                    batch.forEach(processField);
                });
            } else if (field.type === 'union') {
                field.options.forEach(batch => {
                    batch.forEach(processField);
                });
            } else {
                dispatch(onFieldChange(field, value));
            }
        };
        fields.forEach(processField);
    } catch (error) {
        console.error('Invalid JSON', error);
    }
};

export const onCancelCall = () => () => {
    TrezorConnect.cancel();
};
