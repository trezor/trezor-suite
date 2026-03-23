import type { TSchema } from '@sinclair/typebox';

import type TrezorConnectMobile from '@trezor/connect-mobile';
import type TrezorConnect from '@trezor/connect-web';
import type { TrezorConnect as TrezorConnectType } from '@trezor/connect-web';

import type { Field } from './common';

// Method action constants
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

// TrezorConnect action constants
export const ON_CHANGE_CONNECT_OPTIONS = 'action__on_change_connect_options';
export const ON_CHANGE_CONNECT_OPTION = 'action__on_change_connect_option';
export const ON_HANDSHAKE_CONFIRMED = 'action__on_handshake_confirmed';
export const ON_INIT_ERROR = 'action__on_init_error';

// Method action types
export type MethodAction =
    | { type: typeof SET_METHOD; methodConfig: any }
    | { type: typeof SET_SCHEMA; method: keyof TrezorConnectType; schema: TSchema }
    | { type: typeof FIELD_CHANGE; field: Field<any>; value: any }
    | { type: typeof FIELD_DATA_CHANGE; field: Field<any>; data: any }
    | { type: typeof ADD_BATCH; field: Field<any>; item: any }
    | { type: typeof REMOVE_BATCH; field: Field<any>; batch: any[] }
    | { type: typeof SET_UNION; field: Field<any>; current: any }
    | { type: typeof RESPONSE; response: any }
    | { type: typeof SET_MANUAL_MODE; manualMode: boolean }
    | { type: typeof SET_METHOD_PROCESSING; payload: boolean };

// TrezorConnect action types
export type ConnectOptions = Partial<
    Parameters<(typeof TrezorConnect | typeof TrezorConnectMobile)['init']>[0]
>;

export type TrezorConnectAction =
    | { type: typeof ON_CHANGE_CONNECT_OPTIONS; payload: ConnectOptions }
    | { type: typeof ON_HANDSHAKE_CONFIRMED }
    | { type: typeof ON_INIT_ERROR; payload: string }
    | {
          type: typeof ON_CHANGE_CONNECT_OPTION;
          payload: { option: Field<any>; value: any };
      };
