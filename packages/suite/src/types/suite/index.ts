import { ThunkDispatch } from 'redux-thunk';
import { UiEvent, DeviceEvent, TransportEvent } from 'trezor-connect';
import { BlockchainActions } from '@suite-actions/blockchainActions';
import { RouterActions } from '@suite-actions/routerActions';
import { AppState } from '@suite/reducers/store';

import { StorageActions } from '@suite-actions/storageActions';
import { SuiteActions } from '@suite-actions/suiteActions';
import { ModalActions } from '@suite-actions/modalActions';
import { LogActions } from '@suite-actions/logActions';
import { Action as WalletActions } from '@wallet-types/index';
import OnboardingActions from '@onboarding-types/actions';

import {
    MessageDescriptor as MessageDescriptor$,
    Messages as Messages$,
} from '@suite-support/ConnectedIntlProvider';

// this weird export is because of --isolatedModules and next.js 9
export type MessageDescriptor = MessageDescriptor$;
export type Messages = Messages$;

export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

type TrezorConnectEvents =
    | Omit<TransportEvent, 'event'>
    | Omit<UiEvent, 'event'>
    | Omit<DeviceEvent, 'event'>
    | { type: 'iframe-loaded'; payload: any };

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
    | WalletActions
    | OnboardingActions;

// export type Dispatch = ReduxDispatch<Action>;
export type Dispatch = ThunkDispatch<AppState, any, Action>;
export type GetState = () => AppState;

// tmp
type Features = any;
type FirmwareRelease = any;
// type DeviceStatus = 'available' | 'occupied' | 'used';
// type DeviceMode = 'normal' | 'bootloader' | 'initialize' | 'seedless';
// type DeviceFirmwareStatus = 'valid' | 'outdated' | 'required' | 'unknown' | 'none';
type DeviceStatus = any;
type DeviceMode = any;
type DeviceFirmwareStatus = any;

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
    features: undefined;
    state: undefined;
    useEmptyPassphrase: boolean;

    remember: boolean; // device should be remembered
    connected: boolean; // device is connected
    available: boolean; // device cannot be used because of features.passphrase_protection is different then expected
    instance?: number;
    instanceLabel: string;
    instanceName?: string;
    ts: number;
}

export type TrezorDevice = AcquiredDevice | UnknownDevice;
