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
    BlockchainEvent,
} from 'trezor-connect';
import { RouterActions } from '@suite-actions/routerActions';
import { AppState as AppState$ } from '@suite/reducers/store';
import { StorageActions } from '@suite-actions/storageActions';
import { SuiteActions } from '@suite-actions/suiteActions';
import { ResizeActions } from '@suite-actions/resizeActions';
import { ModalActions } from '@suite-actions/modalActions';
import { LogActions } from '@suite-actions/logActions';
import { NotificationActions } from '@suite-actions/notificationActions';
import OnboardingActions from '@onboarding-types/actions';
import { SettingsActions } from '@settings-types';
import { ExtendedMessageDescriptor as ExtendedMessageDescriptor$ } from '@suite-support/ConnectedIntlProvider';
import { WalletAction } from '@wallet-types';

// this weird export is because of --isolatedModules and next.js 9
export type ExtendedMessageDescriptor = ExtendedMessageDescriptor$;

type TrezorConnectEvents =
    | Omit<TransportEvent, 'event'>
    | UiEvent
    | Omit<DeviceEvent, 'event'>
    | BlockchainEvent;

export type AppState = AppState$;

// all actions from all apps used to properly type Dispatch.
export type Action =
    | TrezorConnectEvents
    | RouterActions
    | ResizeActions
    | StorageActions
    | SuiteActions
    | LogActions
    | ModalActions
    | NotificationActions
    | WalletAction
    | OnboardingActions
    | SettingsActions;

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
    authConfirm: boolean; // device cannot be used because passphrase was not confirmed
    instance?: number;
    ts: number;
    buttonRequests: string[];
}

export interface UnknownDevice {
    type: 'unacquired' | 'unreadable';
    path: string;
    label: string;
    connected: true;
    available: false;
    features: undefined;
    instance?: undefined;
    useEmptyPassphrase: true;
    // types below are here just for type compatibility with AcquiredDevice
    remember?: boolean;
    authConfirm?: undefined;
    state?: string;
    ts: number;
    buttonRequests: string[];
}

export type TrezorDevice = AcquiredDevice | UnknownDevice;

export type Store = ReduxStore<AppState, Action>;

export type InjectedModalApplicationProps = {
    modal: React.ReactNode;
    cancelable: boolean;
    closeModalApp: () => void;
};
