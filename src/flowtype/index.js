/* @flow */


import type {
    Store as ReduxStore,
    ReduxDispatch,
    MiddlewareAPI as ReduxMiddlewareAPI,
    Middleware as ReduxMiddleware,
    ThunkAction as ReduxThunkAction,
    AsyncAction as ReduxAsyncAction,
    ThunkDispatch as ReduxThunkDispatch,
    PlainDispatch as ReduxPlainDispatch,
} from 'redux';

import type { Reducers, ReducersState } from '~/js/reducers';

// Actions
import type { SelectedAccountAction } from '~/js/actions/SelectedAccountActions';
import type { AccountAction } from '~/js/actions/AccountsActions';
import type { DiscoveryAction } from '~/js/actions/DiscoveryActions';
import type { StorageAction } from '~/js/actions/LocalStorageActions';
import type { LogAction } from '~/js/actions/LogActions';
import type { ModalAction } from '~/js/actions/ModalActions';
import type { NotificationAction } from '~/js/actions/NotificationActions';
import type { PendingTxAction } from '~/js/actions/PendingTxActions';
import type { ReceiveAction } from '~/js/actions/ReceiveActions';
import type { SendFormAction } from '~/js/actions/SendFormActions';
import type { SummaryAction } from '~/js/actions/SummaryActions';
import type { TokenAction } from '~/js/actions/TokenActions';
import type { TrezorConnectAction } from '~/js/actions/TrezorConnectActions';
import type { WalletAction } from '~/js/actions/WalletActions';
import type { Web3Action } from '~/js/actions/Web3Actions';
import type { FiatRateAction } from '~/js/services/CoinmarketcapService'; // this service has no action file, all is written inside one file

import type {
    Device,
    Features,
    DeviceMessageType,
    TransportMessageType,
    UiMessageType,
} from 'trezor-connect';

import type { RouterAction, LocationState } from 'react-router-redux';

export type TrezorDevice = {
    remember: boolean; // device should be remembered
    connected: boolean; // device is connected
    available: boolean; // device cannot be used because of features.passphrase_protection is different then expected
    path: string;
    label: string;
    state: ?string;
    instance?: number;
    instanceLabel: string;
    instanceName: ?string;
    features?: Features;
    unacquired?: boolean;
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
    // payload: {
    //     device: Device;
    //     code?: string;
    // },
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

    | SelectedAccountAction
    | AccountAction
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

// reexport reduces types
export type { Coin } from '~/js/reducers/LocalStorageReducer';
export type { Account } from '~/js/reducers/AccountsReducer';
export type { Discovery } from '~/js/reducers/DiscoveryReducer';
export type { Token } from '~/js/reducers/TokensReducer';
export type { Web3Instance } from '~/js/reducers/Web3Reducer';
export type { PendingTx } from '~/js/reducers/PendingTxReducer';

export type Accounts = $ElementType<State, 'accounts'>;
export type LocalStorage = $ElementType<State, 'localStorage'>;
export type Config = $PropertyType<$ElementType<State, 'localStorage'>, 'config'>;

export type Dispatch = ReduxDispatch<State, Action>;
export type MiddlewareDispatch = ReduxPlainDispatch<Action>;

export type MiddlewareAPI = ReduxMiddlewareAPI<State, Action>;
export type Middleware = ReduxMiddleware<State, Action>;

export type ThunkAction = ReduxThunkAction<State, Action>;
export type AsyncAction = ReduxAsyncAction<State, Action>;

export type Store = ReduxStore<State, Action>;
export type GetState = () => State;
