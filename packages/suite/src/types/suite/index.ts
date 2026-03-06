import type { Store as ReduxStore } from 'redux';
import type { ThunkAction as TAction, ThunkDispatch } from 'redux-thunk';

import { experimentalFeedbackSlice } from '@suite/experimental-feedback';
import type { MetadataAction } from '@suite/metadata';
import type { ModalAction } from '@suite/modal';
import { analyticsActions } from '@suite-common/analytics-redux';
import { bluetoothActions } from '@suite-common/bluetooth';
import { deviceActions } from '@suite-common/device';
import { firmwareActions } from '@suite-common/firmware';
import { geolocationActions } from '@suite-common/geolocation';
import { addLog } from '@suite-common/logger';
import { messageSystemActions } from '@suite-common/message-system';
import {
    suiteSyncSlice as suiteSyncCommonSlice,
    suiteSyncDataSlice,
} from '@suite-common/suite-sync';
import { suiteSyncQuotaManagerActions } from '@suite-common/suite-sync-quota-manager';
import type { Route } from '@suite-common/suite-types';
import { thpActions } from '@suite-common/thp';
import { notificationsActions } from '@suite-common/toast-notifications';
import { discoveryActions, feesActions, transactionsActions } from '@suite-common/wallet-core';
import { BlockchainEvent, DEVICE, DeviceEvent, TransportEvent, UiEvent } from '@trezor/connect';
import { FilterOutFromUnionByTypeProperty } from '@trezor/type-utils';

import type { BackupAction } from 'src/actions/backup/backupActions';
import { deviceSlice } from 'src/actions/device/deviceSlice';
import type { OnboardingAction } from 'src/actions/onboarding/onboardingActions';
import type { RecoveryAction } from 'src/actions/recovery/recoveryActions';
import type { BioAuthAction } from 'src/actions/suite/bioAuthActions';
import type { DesktopUpdateAction } from 'src/actions/suite/desktopUpdateActions';
import type { GuideAction } from 'src/actions/suite/guideActions';
import type { ProtocolAction } from 'src/actions/suite/protocolActions';
import type { RouterAction } from 'src/actions/suite/routerActions';
import type { StorageAction } from 'src/actions/suite/storageActions';
import type { SuiteAction } from 'src/actions/suite/suiteActions';
import type { WindowAction } from 'src/actions/suite/windowActions';
import { suiteSyncSlice } from 'src/actions/suiteSync/suiteSyncSlice';
import type { AppState } from 'src/reducers/store';
import { GlobalSendReceiveAction } from 'src/slices/wallet/globalSendReceiveFilters';
import type { WalletAction } from 'src/types/wallet';

import { bluetoothSlice } from '../../actions/bluetooth/desktopBluetoothReducer';

// reexport
export type {
    AcquiredDevice,
    ButtonRequest,
    ExtendedDevice,
    TrezorDevice,
    UnknownDevice,
    UnreadableDevice,
} from '@suite-common/suite-types';
export type { AppState } from 'src/reducers/store';
export type { PrerequisiteType } from 'src/utils/suite/prerequisites';
export type { Route };

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
type BluetoothAction = ReturnType<(typeof bluetoothActions)[keyof typeof bluetoothActions]>;
type BluetoothActionDesktop = ReturnType<
    (typeof bluetoothSlice.actions)[keyof typeof bluetoothSlice.actions]
>;
type SuiteSyncAction = ReturnType<
    (typeof suiteSyncSlice.actions)[keyof typeof suiteSyncSlice.actions]
>;
type SuiteSyncActionCommon = ReturnType<
    (typeof suiteSyncCommonSlice.actions)[keyof typeof suiteSyncCommonSlice.actions]
>;
type SuiteSyncDataAction = ReturnType<
    (typeof suiteSyncDataSlice.actions)[keyof typeof suiteSyncDataSlice.actions]
>;
type SuiteSyncActionDesktop = ReturnType<
    (typeof suiteSyncSlice.actions)[keyof typeof suiteSyncSlice.actions]
>;
type SuiteSyncQuotaManagerAction = ReturnType<
    (typeof suiteSyncQuotaManagerActions)[keyof typeof suiteSyncQuotaManagerActions]
>;
type ExperimentalFeedbackAction = ReturnType<
    (typeof experimentalFeedbackSlice.actions)[keyof typeof experimentalFeedbackSlice.actions]
>;
type DeviceActionDesktop = ReturnType<
    (typeof deviceSlice.actions)[keyof typeof deviceSlice.actions]
>;
type ThpAction = ReturnType<(typeof thpActions)[keyof typeof thpActions]>;
type GeolocationAction = ReturnType<(typeof geolocationActions)[keyof typeof geolocationActions]>;
type FeeAction = ReturnType<(typeof feesActions)[keyof typeof feesActions]>;

// all actions from all apps used to properly type Dispatch.
export type Action =
    | AnalyticsAction
    | BackupAction
    | BioAuthAction
    | BluetoothAction
    | BluetoothActionDesktop
    | DesktopUpdateAction
    | DeviceAction
    | ExperimentalFeedbackAction
    | DeviceActionDesktop
    | DiscoveryAction
    | FeeAction
    | FirmwareAction
    | GeolocationAction
    | GuideAction
    | MessageSystemAction
    | MetadataAction
    | ModalAction
    | NotificationAction
    | OnboardingAction
    | ProtocolAction
    | RecoveryAction
    | ReturnType<typeof addLog>
    | RouterAction
    | StorageAction
    | SuiteAction
    | SuiteSyncAction
    | SuiteSyncActionCommon
    | SuiteSyncDataAction
    | SuiteSyncActionDesktop
    | SuiteSyncQuotaManagerAction
    | ThpAction
    | TransactionAction
    | TrezorConnectEvents
    | WalletAction
    | WindowAction
    | GlobalSendReceiveAction;

export type ThunkAction = TAction<any, AppState, any, Action>;

export type Dispatch = ThunkDispatch<AppState, any, Action>;

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
