import { ThunkDispatch } from 'redux-thunk';
import { 
    UiEvent,
    DeviceEvent,
    TransportEvent
} from 'trezor-connect';
import { RouterActions } from './actions/routerActions';

import { BlockchainActions } from './actions/blockchainActions';
import { StorageActions } from './actions/storageActions';
import { SuiteActions } from './actions/suiteActions';
import { State as ReducersState } from './reducers/store';

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
type TrezorConnectEvents = Omit<TransportEvent, 'event'> | Omit<UiEvent, 'event'> | Omit<DeviceEvent, 'event'>;

export type State = ReducersState;
export type Action = TrezorConnectEvents | RouterActions | BlockchainActions | StorageActions | SuiteActions;

// export type Dispatch = ReduxDispatch<Action>;
export type Dispatch = ThunkDispatch<State, any, Action>;
export type GetState = () => State;

// tmp
type Features = any;
type DeviceFirmwareStatus = any;
type FirmwareRelease = any;
type DeviceStatus = any;
type DeviceMode = any;

export interface AcquiredDevice {
    type: 'acquired',
    path: string,
    label: string,
    features: Features,
    firmware: DeviceFirmwareStatus,
    firmwareRelease?: FirmwareRelease,
    status: DeviceStatus,
    mode: DeviceMode,
    state?: string,
    useEmptyPassphrase: boolean,

    remember: boolean, // device should be remembered
    connected: boolean, // device is connected
    available: boolean, // device cannot be used because of features.passphrase_protection is different then expected
    instance?: number,
    instanceLabel: string,
    instanceName?: string,
    ts: number,
};

export interface UnknownDevice {
    type: 'unacquired' | 'unreadable',
    path: string,
    label: string,
    features: undefined,
    state: undefined,
    useEmptyPassphrase: boolean,

    remember: boolean, // device should be remembered
    connected: boolean, // device is connected
    available: boolean, // device cannot be used because of features.passphrase_protection is different then expected
    instance?: number,
    instanceLabel: string,
    instanceName?: string,
    ts: number,
};

export type TrezorDevice = AcquiredDevice | UnknownDevice;