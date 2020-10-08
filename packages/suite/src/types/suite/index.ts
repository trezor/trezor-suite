import { ThunkDispatch } from 'redux-thunk';
import { Store as ReduxStore } from 'redux';
import {
    UiEvent,
    DeviceEvent,
    TransportEvent,
    BlockchainEvent,
    KnownDevice,
    UnknownDevice as UnknownDeviceBase,
} from 'trezor-connect';
import { RouterActions } from '@suite-actions/routerActions';
import { Route as Route$ } from '@suite-constants/routes';
import { AppState as AppState$ } from '@suite/reducers/store';
import { StorageActions } from '@suite-actions/storageActions';
import { SuiteActions } from '@suite-actions/suiteActions';
import { ResizeActions } from '@suite-actions/resizeActions';
import { ModalActions } from '@suite-actions/modalActions';
import { LogActions } from '@suite-actions/logActions';
import { NotificationActions } from '@suite-actions/notificationActions';
import { AnalyticsActions } from '@suite-actions/analyticsActions';
import { MetadataActions } from '@suite-actions/metadataActions';
import { DesktopUpdateActions } from '@suite-actions/desktopUpdateActions';
import { DeviceMetadata } from '@suite-types/metadata';
import { OnboardingActions } from '@onboarding-types';
import { SettingsActions } from '@settings-types';
import { FirmwareActions } from '@firmware-types';
import { ExtendedMessageDescriptor as ExtendedMessageDescriptor$ } from '@suite-components/Translation/components/BaseTranslation';
import { WalletAction } from '@wallet-types';
import { BackupActions } from '@backup-actions/backupActions';
import { RecoveryActions } from '@recovery-actions/recoveryActions';
import { ObjectValues } from '@suite/types/utils';
import { SUITE } from '@suite-actions/constants';
import { PROCESS_MODE } from '@suite-middlewares/actionBlockerMiddleware';

// this weird export is because of --isolatedModules and next.js 9
export type ExtendedMessageDescriptor = ExtendedMessageDescriptor$;

type TrezorConnectEvents = TransportEvent | UiEvent | DeviceEvent | BlockchainEvent;

export type AppState = AppState$;

export type Route = Route$;

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
    | AnalyticsActions
    | MetadataActions
    | WalletAction
    | OnboardingActions
    | FirmwareActions
    | BackupActions
    | RecoveryActions
    | SettingsActions
    | DesktopUpdateActions;

// export type Dispatch = ReduxDispatch<Action>;
// export type Dispatch = ThunkDispatch<AppState, any, Action>;
// fixed return type from `dispatch(A)` in actions
export interface Dispatch extends ThunkDispatch<AppState, any, Action> {
    <Action>(action: Action): Action extends (...args: any) => infer R ? R : Action;
}
export type GetState = () => AppState;

export interface ExtendedDevice {
    useEmptyPassphrase: boolean;
    passphraseOnDevice?: boolean;
    remember?: boolean; // device should be remembered
    connected: boolean; // device is connected
    available: boolean; // device cannot be used because of features.passphrase_protection is different then expected
    authConfirm?: boolean; // device cannot be used because passphrase was not confirmed
    authFailed?: boolean; // device cannot be used because authorization process failed
    instance?: number;
    ts: number;
    buttonRequests: string[];
    metadata: DeviceMetadata;
    processMode?: keyof typeof PROCESS_MODE;
}

export type AcquiredDevice = KnownDevice & ExtendedDevice;

export type UnknownDevice = UnknownDeviceBase & ExtendedDevice;

export type TrezorDevice = AcquiredDevice | UnknownDevice;

export type Store = ReduxStore<AppState, Action>;

export type Lock = ObjectValues<typeof SUITE.LOCK_TYPE>;

export type InjectedModalApplicationProps = {
    modal: JSX.Element | null;
    cancelable: boolean;
    onCancel: () => void;
    closeModalApp: (preserveParams?: boolean) => void;
    getBackgroundRoute: () => Route$ | typeof undefined;
};

export type ToastNotificationVariant = 'success' | 'info' | 'warning' | 'error';
