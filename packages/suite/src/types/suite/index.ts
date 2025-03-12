import type { Store as ReduxStore } from 'redux';
import type { ThunkAction as TAction, ThunkDispatch } from 'redux-thunk';

import { analyticsActions } from '@suite-common/analytics';
import { deviceAuthenticityActions } from '@suite-common/device-authenticity';
import { firmwareActions } from '@suite-common/firmware';
import { addLog } from '@suite-common/logger';
import { messageSystemActions } from '@suite-common/message-system';
import type { Route } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { deviceActions, discoveryActions, transactionsActions } from '@suite-common/wallet-core';
import { BlockchainEvent, DEVICE, DeviceEvent, TransportEvent, UiEvent } from '@trezor/connect';
import { FilterOutFromUnionByTypeProperty } from '@trezor/type-utils';

import type { BackupAction } from 'src/actions/backup/backupActions';
import type { OnboardingAction } from 'src/actions/onboarding/onboardingActions';
import type { RecoveryAction } from 'src/actions/recovery/recoveryActions';
import type { WalletSettingsAction } from 'src/actions/settings/walletSettingsActions';
import type { DesktopUpdateAction } from 'src/actions/suite/desktopUpdateActions';
import type { GuideAction } from 'src/actions/suite/guideActions';
import type { MetadataAction } from 'src/actions/suite/metadataActions';
import type { ModalAction } from 'src/actions/suite/modalActions';
import type { ProtocolAction } from 'src/actions/suite/protocolActions';
import type { RouterAction } from 'src/actions/suite/routerActions';
import type { StorageAction } from 'src/actions/suite/storageActions';
import type { SuiteAction } from 'src/actions/suite/suiteActions';
import type { WindowAction } from 'src/actions/suite/windowActions';
import type { AppState } from 'src/reducers/store';
import type { WalletAction } from 'src/types/wallet';

// reexport
export type { ExtendedMessageDescriptor } from 'src/components/suite/Translation';
export type { AppState } from 'src/reducers/store';
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

type FilteredDeviceEvents = FilterOutFromUnionByTypeProperty<
    DeviceEvent,
    'type',
    // Those types are remapped onto different actions in the connectInitThunks.ts and not used directly
    // as the rest of the DeviceEvents.
    typeof DEVICE.CONNECT | typeof DEVICE.CONNECT_UNACQUIRED
>;

type TrezorConnectEvents = TransportEvent | UiEvent | FilteredDeviceEvents | BlockchainEvent;

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
    | WindowAction
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
    | DeviceAuthenticityAction
    | ReturnType<typeof addLog>;

export type ThunkAction = TAction<any, AppState, any, Action>;

// export type Dispatch = ReduxDispatch<Action>;
// export type Dispatch = ThunkDispatch<AppState, any, Action>;
// fixed return type from `dispatch(A)` in actions
export interface Dispatch extends ThunkDispatch<AppState, any, Action> {
    <A extends Action>(action: A): A extends (...args: any) => infer R ? R : A;
}

export type GetState = () => AppState;

export type Store = ReduxStore<AppState, Action>;

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

export enum DisplayMode {
    CHUNKS = 1,
    PAGINATED_TEXT,
    SINGLE_WRAPPED_TEXT,
}
