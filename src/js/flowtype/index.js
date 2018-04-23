/* @flow */
'use strict';

import type {
    Store as ReduxStore,
    Dispatch as ReduxDispatch,
    MiddlewareAPI as ReduxMiddlewareAPI,
    Middleware as ReduxMiddleware,
    ThunkAction as ReduxThunkAction,
    ThunkDispatch as ReduxThunkDispatch,
    PlainDispatch as ReduxPlainDispatch
} from 'redux';

import type { Reducers, ReducersState } from '../reducers';

// Actions
import type { AbstractAccountAction } from '../actions/AbstractAccountActions';
import type { AddressAction } from '../actions/AddressActions';
import type { DiscoveryAction } from '../actions/DiscoveryActions';
import type { StorageAction } from '../actions/LocalStorageActions';
import type { LogAction } from '../actions/LogActions';
import type { ModalAction } from '../actions/ModalActions';
import type { NotificationAction } from '../actions/NotificationActions';
import type { PendingTxAction } from '../actions/PendingTxActions';
import type { ReceiveAction } from '../actions/ReceiveActions';
import type { SendFormAction } from '../actions/SendFormActions';
import type { SummaryAction } from '../actions/SummaryActions';
import type { TokenAction } from '../actions/TokenActions';
import type { TrezorConnectAction } from '../actions/TrezorConnectActions';
import type { WalletAction } from '../actions/WalletActions';
import type { Web3Action } from '../actions/Web3Actions';
import type { FiatRateAction } from '../services/CoinmarketcapService'; // this service has no action file, all is written inside one file

import type {
    Device,
    Features,
    DeviceMessageType,
    TransportMessageType,
    UiMessageType,
} from 'trezor-connect';

import type { RouterAction, LocationState } from 'react-router-redux';

export type TrezorDevice = {
    remember: boolean;
    connected: boolean;
    available: boolean; // device cannot be used because of features.passphrase_protection is different then expected (saved)
    path: string;
    label: string;
    state: ?string;
    instance?: number;
    instanceLabel: string;
    features?: Features;
    unacquired?: boolean;
    acquiring: boolean;
    isUsedElsewhere?: boolean;
    featuresNeedsReload?: boolean;
    ts: number;
}

export type AcquiredDevice = {
    remember: boolean;
    connected: boolean;
    available: boolean; // device cannot be used because of features.passphrase_protection is different then expected (saved)
    path: string;
    label: string;
    state: string;
    instance: ?number;
    instanceLabel: string;
    features: Features;
    acquiring: boolean;
    isUsedElsewhere?: boolean;
    featuresNeedsReload?: boolean;
    ts: number;
}

export type RouterLocationState = LocationState;

// Cast event from TrezorConnect event listener to react Action
type DeviceEventAction = {
    type: DeviceMessageType,
    device: Device,
}

type TransportEventAction = {
    type: TransportMessageType,
    payload: any,
}

type UiEventAction = {
    type: UiMessageType,
    payload: any,
}

// TODO: join this message with uiMessage
type IFrameHandshake = {
    type: 'iframe_handshake',
    payload: any
}

export type Action = 
    RouterAction
    | IFrameHandshake
    | TransportEventAction
    | DeviceEventAction
    | UiEventAction
    
    | AbstractAccountAction
    | AddressAction
    | DiscoveryAction
    | StorageAction 
    | LogAction 
    | ModalAction 
    | NotificationAction
    | PendingTxAction
    | ReceiveAction
    | SendFormAction
    | SummaryAction
    | TokenAction
    | TrezorConnectAction
    | WalletAction
    | Web3Action
    | FiatRateAction;

export type State = ReducersState;

export type Accounts = $ElementType<State, 'accounts'>;
export type LocalStorage = $ElementType<State, 'localStorage'>;
export type Config = $PropertyType<$ElementType<State, 'localStorage'>, 'config'>;

export type Dispatch = ReduxDispatch<State, Action>;
export type MiddlewareDispatch = ReduxPlainDispatch<Action>;

export type MiddlewareAPI = ReduxMiddlewareAPI<State, Action>;
export type Middleware = ReduxMiddleware<State, Action>;

export type Store = ReduxStore<State, Action>;
export type GetState = () => State;
export type AsyncAction = ReduxThunkAction<State, Action>;
