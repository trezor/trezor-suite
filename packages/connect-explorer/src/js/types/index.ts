import { ThunkDispatch } from 'redux-thunk';
// import { UiEvent, DeviceEvent, TransportEvent } from 'trezor-connect';
import { AppState } from '../store';

import { DocsActions } from '../actions/DocsActions';
import { DOMActions } from '../actions/DOMActions';
import { MethodActions } from '../actions/MethodActions';
import { ModalActions } from '../actions/ModalActions';
import { TrezorConnectActions } from '../actions/TrezorConnectActions';

export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

// type TrezorConnectEvents =
//     | Omit<TransportEvent, 'event'>
//     | Omit<UiEvent, 'event'>
//     | Omit<DeviceEvent, 'event'>
//     | { type: 'iframe-loaded'; payload: any };
type TrezorConnectEvents = any;
export type AppState = AppState;

export type Action =
    | TrezorConnectEvents
    | DocsActions
    | DOMActions
    | MethodActions
    | ModalActions
    | TrezorConnectActions;

export type Tab = 'docs' | 'code' | 'response';
export type Field = any; // todo;
export type Modal = any; // todo:

export type Dispatch = ThunkDispatch<AppState, any, Action>;
export type GetState = () => AppState;
