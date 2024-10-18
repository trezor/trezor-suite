import { TSchema } from '@sinclair/typebox';
import JSON5 from 'json5';

import TrezorConnect from '@trezor/connect-web';
import TrezorConnectMobile from '@trezor/connect-mobile';
import { getDeepValue } from '@trezor/schema-utils/src/utils';

import { GetState, Dispatch, Field } from '../types';

export const SET_METHOD = 'method_set';
export const SET_SCHEMA = 'schema_set';
export const FIELD_CHANGE = 'method_field_change';
export const FIELD_DATA_CHANGE = 'method_field_data_change';
export const ADD_BATCH = 'method_add_batch';
export const REMOVE_BATCH = 'method_remove_batch';
export const SET_UNION = 'method_set_union';
export const RESPONSE = 'method_response';
export const SET_MANUAL_MODE = 'method_set_manual_mode';
export const SET_METHOD_PROCESSING = 'method_set_processing';

export type MethodAction =
    | { type: typeof SET_METHOD; methodConfig: any }
    | { type: typeof SET_SCHEMA; method: keyof typeof TrezorConnect; schema: TSchema }
    | { type: typeof FIELD_CHANGE; field: Field<any>; value: any }
    | { type: typeof FIELD_DATA_CHANGE; field: Field<any>; data: any }
    | { type: typeof ADD_BATCH; field: Field<any>; item: any }
    | { type: typeof REMOVE_BATCH; field: Field<any>; batch: any[] }
    | { type: typeof SET_UNION; field: Field<any>; current: any }
    | { type: typeof RESPONSE; response: any }
    | { type: typeof SET_MANUAL_MODE; manualMode: boolean }
    | { type: typeof SET_METHOD_PROCESSING; payload: boolean };
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

    const verifyMethod = getState().method;
    verifyMethod?.fields.forEach((f: any) => {
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
            if (field.type === 'array') {
                field.items.forEach(batch => {
                    batch.forEach(processField);
                });
            } else if (field.type === 'union') {
                field.options.forEach(batch => {
                    batch.forEach(processField);
                });
            }

            if (field.path && field.path.length > 0) {
                dispatch(
                    onFieldChange(
                        field,
                        getDeepValue(parsed, [...field.path, ...field.name.split('.')]),
                    ),
                );
            } else {
                dispatch(onFieldChange(field, getDeepValue(parsed, field.name.split('.'))));
            }
        };
        fields.forEach(processField);
    } catch (error) {
        console.error('Invalid JSON', error);
    }
};
