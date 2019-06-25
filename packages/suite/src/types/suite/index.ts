import { ThunkDispatch } from 'redux-thunk';
import { UiEvent, DeviceEvent, TransportEvent } from 'trezor-connect';
import { BlockchainActions } from '@suite-actions/blockchainActions';
import { RouterActions } from '@suite-actions/routerActions';

import { StorageActions } from '@suite-actions/storageActions';
import { SuiteActions } from '@suite-actions/suiteActions';
import { settingsActions as WalletSettingsActions } from '@wallet-actions/settingsActions';
import { NotificationActions as WalletNotificationActions } from '@wallet-actions/notificationActions';
import { SignVerifyAction as WalletSignVerifyAction } from '@wallet-actions/signVerifyActions';
import { LogActions } from '@suite-actions/logActions';
import { State as ReducersState } from '@suite/reducers/store';
import OnboardingActions from '@onboarding-types/actions';

export { MessageDescriptor } from '@suite-support/ConnectedIntlProvider';
export { Messages } from '@suite-support/ConnectedIntlProvider';

export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

type TrezorConnectEvents =
    | Omit<TransportEvent, 'event'>
    | Omit<UiEvent, 'event'>
    | Omit<DeviceEvent, 'event'>
    | { type: 'iframe-loaded'; payload: any };

export type State = ReducersState;

// actions from Wallet sub app
export type WalletAction = WalletSettingsActions | WalletSignVerifyAction | WalletNotificationActions;

// all actions from all apps
export type Action =
    | TrezorConnectEvents
    | RouterActions
    | BlockchainActions
    | StorageActions
    | SuiteActions
    | LogActions
    | OnboardingActions
    | WalletActions;

// export type Dispatch = ReduxDispatch<Action>;
export type Dispatch = ThunkDispatch<State, any, Action>;
export type GetState = () => State;

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
