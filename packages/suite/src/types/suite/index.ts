import type { ThunkDispatch, ThunkAction as TAction } from 'redux-thunk';
import type { Store as ReduxStore } from 'redux';
import type { UiEvent, DeviceEvent, TransportEvent, BlockchainEvent } from '@trezor/connect';
import type { RouterAction } from '@suite-actions/routerActions';
import type { AppState } from '@suite/reducers/store';
import type { StorageAction } from '@suite-actions/storageActions';
import type { SuiteAction } from '@suite-actions/suiteActions';
import type { ResizeAction } from '@suite-actions/resizeActions';
import type { ModalAction } from '@suite-actions/modalActions';
import type { LogAction } from '@suite-actions/logsActions';
import type { AnalyticsAction } from '@suite-actions/analyticsActions';
import type { MetadataAction } from '@suite-actions/metadataActions';
import type { ProtocolAction } from '@suite-actions/protocolActions';
import type { DesktopUpdateAction } from '@suite-actions/desktopUpdateActions';
import type { OnboardingAction } from '@onboarding-actions/onboardingActions';
import type { WalletSettingsAction } from '@settings-actions/walletSettingsActions';
import type { FirmwareAction } from '@firmware-actions/firmwareActions';
import type { WalletAction } from '@wallet-types';
import type { BackupAction } from '@backup-actions/backupActions';
import type { RecoveryAction } from '@recovery-actions/recoveryActions';
import type { ObjectValues } from '@trezor/type-utils';
import type { SUITE } from '@suite-actions/constants';
import type { MessageSystemAction } from '@suite-actions/messageSystemActions';
import type { GuideAction } from '@suite-actions/guideActions';
import type { EnvironmentType } from '@suite-common/suite-types';
import type { Route } from '@suite-constants/routes';
import { transactionsActions } from '@suite-common/wallet-core';
import { notificationsActions } from '@suite-common/toast-notifications';

// reexport
export type { ExtendedMessageDescriptor } from '@suite-components/Translation/components/BaseTranslation';
export type { AppState } from '@suite/reducers/store';
export type { SuiteThemeColors } from '@trezor/components';
export type { PrerequisiteType } from '@suite-utils/prerequisites';
export type { Route, EnvironmentType };
export type {
    ButtonRequest,
    ExtendedDevice,
    AcquiredDevice,
    UnknownDevice,
    UnreadableDevice,
    TrezorDevice,
} from '@suite-common/suite-types';

type TrezorConnectEvents = TransportEvent | UiEvent | DeviceEvent | BlockchainEvent;

export type TransactionAction = ReturnType<
    typeof transactionsActions[keyof typeof transactionsActions]
>;
export type NotificationAction = ReturnType<
    typeof notificationsActions[keyof typeof notificationsActions]
>;

// all actions from all apps used to properly type Dispatch.
export type Action =
    | TrezorConnectEvents
    | RouterAction
    | ResizeAction
    | StorageAction
    | SuiteAction
    | TransactionAction
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
    | MessageSystemAction
    | GuideAction
    | ProtocolAction;

export type ThunkAction = TAction<any, AppState, any, Action>;

// export type Dispatch = ReduxDispatch<Action>;
// export type Dispatch = ThunkDispatch<AppState, any, Action>;
// fixed return type from `dispatch(A)` in actions
export interface Dispatch extends ThunkDispatch<AppState, any, Action> {
    <Action>(action: Action): Action extends (...args: any) => infer R ? R : Action;
}

export type GetState = () => AppState;

export type Store = ReduxStore<AppState, Action>;

export type Lock = ObjectValues<typeof SUITE.LOCK_TYPE>;

export type ForegroundAppRoute = Extract<
    Route,
    { isForegroundApp: true; isFullscreenApp: false | undefined }
>;

export type ForegroundAppProps = {
    cancelable: boolean;
    onCancel: (preserveParams?: boolean) => void;
};

export type ToastNotificationVariant = 'success' | 'info' | 'warning' | 'error' | 'transparent';

export enum TorStatus {
    Disabled = 'Disabled',
    Enabling = 'Enabling',
    Disabling = 'Disabling',
    Enabled = 'Enabled',
    Error = 'Error',
}

export interface TorBootstrap {
    current: number;
    total: number;
    isSlow?: boolean;
}

export enum FirmwareType {
    BitcoinOnly = 'Bitcoin-only',
    Universal = 'Universal',
}
