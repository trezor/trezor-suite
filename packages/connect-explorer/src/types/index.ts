import type { ThunkDispatch } from 'redux-thunk';
import type { AppState as AppState$ } from '../reducers';

import type { KnownDevice, UnknownDevice, UnreadableDevice } from '@trezor/connect-web';

import type { DocsAction } from '../actions/docsActions';
import type { DOMAction } from '../actions/DOMActions';
import type { MethodAction } from '../actions/methodActions';
import type { RouterAction } from '../actions/routerActions';
import type { TrezorConnectAction } from '../actions/trezorConnectActions';

export type Action = DocsAction | DOMAction | MethodAction | RouterAction | TrezorConnectAction;

export type AppState = AppState$;
export type GetState = () => AppState$;

export interface Dispatch extends ThunkDispatch<AppState$, any, Action> {
    <Action>(action: Action): Action extends (...args: any) => infer R ? R : Action;
}

export type TrezorConnectDevice = KnownDevice | UnknownDevice | UnreadableDevice;

export interface FieldData {
    value: string;
    label: string;
    affectedValue: string;
}

export interface Field<Value> {
    name: string;
    batch?: any[];
    items?: any[];
    data?: FieldData[];
    omit?: boolean;
    optional?: boolean;
    key: string;
    affect?: string;
    type:
        | 'input'
        | 'input-long'
        | 'select'
        | 'checkbox'
        | 'textarea'
        | 'number'
        | 'address'
        | 'json'
        | 'function'
        | 'file';
    value: Value;
    defaultValue?: Value;
}

interface Batch<Value> {
    type: string;
    fields: Field<Value>[];
}

export interface FieldWithBundle<Value> {
    name: 'bundle';
    type: 'array';
    items: Field<Value>[][];
    batch: Batch<Value>[];
}
