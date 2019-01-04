/* @flow */

import type {
    Store as ReduxStore,
    ReduxDispatch,
    MiddlewareAPI as ReduxMiddlewareAPI,
    Middleware as ReduxMiddleware,
    ThunkAction as ReduxThunkAction,
    PayloadAction as ReduxPayloadAction,
    AsyncAction as ReduxAsyncAction,
    PromiseAction as ReduxPromiseAction,
    PlainDispatch as ReduxPlainDispatch,
} from 'redux';

import type { ReducersState } from 'reducers';

// Actions
import type { SelectedAccountAction } from 'actions/SelectedAccountActions';
import type { AccountAction } from 'actions/AccountsActions';
import type { BlockchainAction } from 'actions/BlockchainActions';
import type { DiscoveryAction } from 'actions/DiscoveryActions';
import type { StorageAction } from 'actions/LocalStorageActions';
import type { LogAction } from 'actions/LogActions';
import type { ModalAction } from 'actions/ModalActions';
import type { NotificationAction } from 'actions/NotificationActions';
import type { PendingTxAction } from 'actions/PendingTxActions';
import type { ReceiveAction } from 'actions/ReceiveActions';
import type { SignVerifyAction } from 'actions/SignVerifyActions';
import type { SendFormAction } from 'actions/SendFormActions';
import type { SummaryAction } from 'actions/SummaryActions';
import type { TokenAction } from 'actions/TokenActions';
import type { TrezorConnectAction } from 'actions/TrezorConnectActions';
import type { WalletAction } from 'actions/WalletActions';
import type { Web3Action } from 'actions/Web3Actions';
import type { FiatRateAction } from 'services/CoingeckoService'; // this service has no action file, all is written inside one file

import type {
    Device,
    Features,
    DeviceStatus,
    DeviceFirmwareStatus,
    DeviceMode,
    DeviceMessageType,
    TransportMessageType,
    UiMessageType,
    BlockchainEvent,
    BlockchainLinkTransaction,
} from 'trezor-connect';

import type { RouterAction, LocationState } from 'connected-react-router';

export type AcquiredDevice = $Exact<{
    +type: 'acquired',
    path: string,
    +label: string,
    +features: Features,
    +firmware: DeviceFirmwareStatus,
    status: DeviceStatus,
    +mode: DeviceMode,
    state: ?string,
    useEmptyPassphrase: boolean,

    remember: boolean; // device should be remembered
    connected: boolean; // device is connected
    available: boolean; // device cannot be used because of features.passphrase_protection is different then expected
    instance?: number;
    instanceLabel: string;
    instanceName: ?string;
    ts: number;

}>;

export type UnknownDevice = $Exact<{
    +type: 'unacquired' | 'unreadable',
    path: string,
    +label: string,
    +features: null,
    state: ?string,
    useEmptyPassphrase: boolean,

    remember: boolean; // device should be remembered
    connected: boolean; // device is connected
    available: boolean; // device cannot be used because of features.passphrase_protection is different then expected
    instance?: number;
    instanceLabel: string;
    instanceName: ?string;
    ts: number;
}>;

export type { Device } from 'trezor-connect';
export type TrezorDevice = AcquiredDevice | UnknownDevice;

export type Transaction = BlockchainLinkTransaction & {
    deviceState: string,
    network: string,
    rejected?: boolean,
};

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
    | BlockchainEvent

    | SelectedAccountAction
    | AccountAction
    | BlockchainAction
    | DiscoveryAction
    | StorageAction
    | LogAction
    | SignVerifyAction
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
export type { Network } from 'reducers/LocalStorageReducer';
export type { Account } from 'reducers/AccountsReducer';
export type { Discovery } from 'reducers/DiscoveryReducer';
export type { Token } from 'reducers/TokensReducer';
export type { Web3Instance } from 'reducers/Web3Reducer';
export type { BlockchainFeeLevel } from 'reducers/BlockchainReducer';

export type Accounts = $ElementType<State, 'accounts'>;
export type LocalStorage = $ElementType<State, 'localStorage'>;
export type Config = $PropertyType<$ElementType<State, 'localStorage'>, 'config'>;

export type Dispatch = ReduxDispatch<State, Action>;
export type MiddlewareDispatch = ReduxPlainDispatch<Action>;

export type MiddlewareAPI = ReduxMiddlewareAPI<State, Action>;
export type Middleware = ReduxMiddleware<State, Action>;

export type ThunkAction = ReduxThunkAction<State, Action>;
export type PayloadAction<R> = ReduxPayloadAction<State, Action, R>;
export type AsyncAction = ReduxAsyncAction<State, Action>;
export type PromiseAction<R> = ReduxPromiseAction<State, Action, R>;

export type Store = ReduxStore<State, Action>;
export type GetState = () => State;
