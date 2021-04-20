import type { ThunkDispatch } from 'redux-thunk';
import type { Store as ReduxStore } from 'redux';
import type {
    UiEvent,
    DeviceEvent,
    TransportEvent,
    BlockchainEvent,
    KnownDevice,
    UnknownDevice as UnknownDeviceBase,
} from 'trezor-connect';
import type { RouterAction } from '@suite-actions/routerActions';
import type { Route } from '@suite-constants/routes';
import type { AppState } from '@suite/reducers/store';
import type { StorageAction } from '@suite-actions/storageActions';
import type { SuiteAction } from '@suite-actions/suiteActions';
import type { ResizeAction } from '@suite-actions/resizeActions';
import type { ModalAction } from '@suite-actions/modalActions';
import type { LogAction } from '@suite-actions/logActions';
import type { NotificationAction } from '@suite-actions/notificationActions';
import type { AnalyticsAction } from '@suite-actions/analyticsActions';
import type { MetadataAction } from '@suite-actions/metadataActions';
import type { DesktopUpdateAction } from '@suite-actions/desktopUpdateActions';
import type { OnboardingAction } from '@onboarding-actions/onboardingActions';
import type { WalletSettingsAction } from '@settings-actions/walletSettingsActions';
import type { FirmwareAction } from '@firmware-actions/firmwareActions';
import type { WalletAction } from '@wallet-types';
import type { BackupAction } from '@backup-actions/backupActions';
import type { RecoveryAction } from '@recovery-actions/recoveryActions';
import type { DeviceMetadata } from '@suite-types/metadata';
import type { ObjectValues } from '@suite/types/utils';
import type { SUITE } from '@suite-actions/constants';
import type { PROCESS_MODE } from '@suite-middlewares/actionBlockerMiddleware';
import type { MessageSystemAction } from '@suite-actions/messageSystemActions';

// reexport
export type { ExtendedMessageDescriptor } from '@suite-components/Translation/components/BaseTranslation';
export type { AppState } from '@suite/reducers/store';
export type { Route } from '@suite-constants/routes';
export type { SuiteThemeColors } from '@trezor/components';

type TrezorConnectEvents = TransportEvent | UiEvent | DeviceEvent | BlockchainEvent;

// all actions from all apps used to properly type Dispatch.
export type Action =
    | TrezorConnectEvents
    | RouterAction
    | ResizeAction
    | StorageAction
    | SuiteAction
    | LogAction
    | ModalAction
    | NotificationAction
    | AnalyticsAction
    | MetadataAction
    | WalletAction
    | OnboardingAction
    | FirmwareAction
    | BackupAction
    | RecoveryAction
    | WalletSettingsAction
    | DesktopUpdateAction
    | MessageSystemAction;

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
    forceRemember?: true; // device was forced to be remembered
    connected: boolean; // device is connected
    available: boolean; // device cannot be used because of features.passphrase_protection is different then expected
    authConfirm?: boolean; // device cannot be used because passphrase was not confirmed
    authFailed?: boolean; // device cannot be used because authorization process failed
    instance?: number;
    ts: number;
    buttonRequests: string[];
    metadata: DeviceMetadata;
    processMode?: keyof typeof PROCESS_MODE;
    walletNumber?: number; // number of hidden wallet intended to be used in UI
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
    getBackgroundRoute: () => Route | typeof undefined;
};

export type ToastNotificationVariant = 'success' | 'info' | 'warning' | 'error';
export type SuiteThemeVariant = 'light' | 'dark' | 'custom';
export type EnvironmentType = 'web' | 'desktop' | 'mobile' | '';
