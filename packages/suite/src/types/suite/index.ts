import type { ThunkDispatch, ThunkAction as TAction } from 'redux-thunk';
import type { Store as ReduxStore } from 'redux';

import {
    deviceActions,
    firmwareActions,
    discoveryActions,
    transactionsActions,
} from '@suite-common/wallet-core';
import { analyticsActions } from '@suite-common/analytics';
import type { ObjectValues } from '@trezor/type-utils';
import type { UiEvent, DeviceEvent, TransportEvent, BlockchainEvent } from '@trezor/connect';
import { notificationsActions } from '@suite-common/toast-notifications';
import { messageSystemActions } from '@suite-common/message-system';
import { deviceAuthenticityActions } from '@suite-common/device-authenticity';
import type { Route } from '@suite-common/suite-types';

import type { RouterAction } from 'src/actions/suite/routerActions';
import type { AppState } from 'src/reducers/store';
import type { StorageAction } from 'src/actions/suite/storageActions';
import type { SuiteAction } from 'src/actions/suite/suiteActions';
import type { ResizeAction } from 'src/actions/suite/resizeActions';
import type { ModalAction } from 'src/actions/suite/modalActions';
import type { MetadataAction } from 'src/actions/suite/metadataActions';
import type { ProtocolAction } from 'src/actions/suite/protocolActions';
import type { DesktopUpdateAction } from 'src/actions/suite/desktopUpdateActions';
import type { OnboardingAction } from 'src/actions/onboarding/onboardingActions';
import type { WalletSettingsAction } from 'src/actions/settings/walletSettingsActions';
import type { WalletAction } from 'src/types/wallet';
import type { BackupAction } from 'src/actions/backup/backupActions';
import type { RecoveryAction } from 'src/actions/recovery/recoveryActions';
import type { SUITE } from 'src/actions/suite/constants';
import type { GuideAction } from 'src/actions/suite/guideActions';

// reexport
export type { ExtendedMessageDescriptor } from 'src/components/suite/Translation';
export type { AppState } from 'src/reducers/store';
export type { SuiteThemeColors } from '@trezor/components';
export type { PrerequisiteType } from 'src/utils/suite/prerequisites';
export type { Route };
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
    (typeof transactionsActions)[keyof typeof transactionsActions]
>;
export type NotificationAction = ReturnType<
    (typeof notificationsActions)[keyof typeof notificationsActions]
>;
export type MessageSystemAction = ReturnType<
    (typeof messageSystemActions)[keyof typeof messageSystemActions]
>;
type AnalyticsAction = ReturnType<(typeof analyticsActions)[keyof typeof analyticsActions]>;
type FirmwareAction = ReturnType<(typeof firmwareActions)[keyof typeof firmwareActions]>;
type DeviceAction = ReturnType<(typeof deviceActions)[keyof typeof deviceActions]>;
type DiscoveryAction = ReturnType<(typeof discoveryActions)[keyof typeof discoveryActions]>;
type DeviceAuthenticityAction = ReturnType<
    (typeof deviceAuthenticityActions)[keyof typeof deviceAuthenticityActions]
>;

// all actions from all apps used to properly type Dispatch.
export type Action =
    | TrezorConnectEvents
    | RouterAction
    | ResizeAction
    | StorageAction
    | SuiteAction
    | TransactionAction
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
    | ProtocolAction
    | DiscoveryAction
    | DeviceAction
    | DeviceAuthenticityAction;

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

export { TorStatus } from '@trezor/suite-desktop-api/src/enums';
export interface TorBootstrap {
    current: number;
    total: number;
    isSlow?: boolean;
}
