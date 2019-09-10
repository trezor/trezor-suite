import { ThunkDispatch } from 'redux-thunk';
import { Store as ReduxStore } from 'redux';
import {
    UiEvent,
    DeviceEvent,
    TransportEvent,
    Features,
    DeviceStatus,
    DeviceMode,
    DeviceFirmwareStatus,
    FirmwareRelease,
} from 'trezor-connect';
import { BlockchainActions } from '@suite-actions/blockchainActions';
import { RouterActions } from '@suite-actions/routerActions';
import { AppState } from '@suite/reducers/store';

import { StorageActions } from '@suite-actions/storageActions';
import { SuiteActions } from '@suite-actions/suiteActions';
import { ModalActions } from '@suite-actions/modalActions';
import { LogActions } from '@suite-actions/logActions';
import { NotificationActions } from '@suite-actions/notificationActions';
import { Action as WalletActions } from '@wallet-types/index';
import OnboardingActions from '@onboarding-types/actions';

import {
    MessageDescriptor as MessageDescriptor$,
    Messages as Messages$,
} from '@suite-support/ConnectedIntlProvider';

// this weird export is because of --isolatedModules and next.js 9
export type MessageDescriptor = MessageDescriptor$;
export type Messages = Messages$;

type TrezorConnectEvents = Omit<TransportEvent, 'event'> | UiEvent | Omit<DeviceEvent, 'event'>;

export type AppState = AppState;

// all actions from all apps used to properly type Dispatch.
export type Action =
    | TrezorConnectEvents
    | RouterActions
    | BlockchainActions
    | StorageActions
    | SuiteActions
    | LogActions
    | ModalActions
    | NotificationActions
    | WalletActions
    | OnboardingActions;

// export type Dispatch = ReduxDispatch<Action>;
export type Dispatch = ThunkDispatch<AppState, any, Action>;
export type GetState = () => AppState;

export interface AcquiredDevice {
    type: 'acquired';
    path: string;
    label: string;
    features: Features;
    firmware: DeviceFirmwareStatus;
    firmwareRelease?: FirmwareRelease;
    status: DeviceStatus;
    mode: DeviceMode;
    state?: string;

    // suite specific
    useEmptyPassphrase: boolean;
    remember: boolean; // device should be remembered
    connected: boolean; // device is connected
    available: boolean; // device cannot be used because of features.passphrase_protection is different then expected
    instance?: number;
    instanceLabel: string;
    instanceName?: string;
    ts: number;
}

export interface UnknownDevice {
    type: 'unacquired' | 'unreadable';
    path: string;
    label: string;
    connected: true;
    available: false;
    // types below are here just for compatibility
    features: typeof undefined;
    instance: typeof undefined;
    instanceLabel?: typeof undefined;
    state?: string;
    useEmptyPassphrase: boolean;
    ts: number;

    // remember: boolean; // device should be remembered
    //  // device is connected
    // available: boolean; // device cannot be used because of features.passphrase_protection is different then expected
    // instance?: number;
    // instanceName?: string;
    // ts: number;
}

export type TrezorDevice = AcquiredDevice | UnknownDevice;

// utils types todo: consider moving it to separate file

// make key required
export type RequiredKey<M, K extends keyof M> = Omit<M, K> & Required<Pick<M, K>>;

// object values types
export type ObjectValues<T extends object> = T[keyof T];

export type Store = ReduxStore<AppState, Action>;
