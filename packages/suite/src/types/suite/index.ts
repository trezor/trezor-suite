import type { Store as ReduxStore } from 'redux';
import type { ThunkAction as TAction, ThunkDispatch } from 'redux-thunk';

import type { backupActions } from '@suite/backup';
import { type debugActions } from '@suite/debug';
import type { desktopUpdateActions } from '@suite/desktop-update';
import { type desktopDeviceActions } from '@suite/device';
import { type featureFeedbackActions } from '@suite/feature-feedback';
import type { flagsActions } from '@suite/flags';
import type { LockAction } from '@suite/locks';
import type { MetadataAction } from '@suite/metadata';
import type { ModalAction } from '@suite/modal';
import type { recoveryActions } from '@suite/recovery';
import { type Route, type RouterAction } from '@suite/router';
import { type suiteSettingsActions } from '@suite/settings';
import { type desktopSuiteSyncActions } from '@suite/suite-sync';
import { type TorAction } from '@suite/tor';
import { type analyticsActions } from '@suite-common/analytics-redux';
import { type bluetoothActions } from '@suite-common/bluetooth';
import { type deviceActions } from '@suite-common/device';
import { type discreetModeActions } from '@suite-common/discreet-mode';
import { type firmwareActions } from '@suite-common/firmware';
import { type geolocationActions } from '@suite-common/geolocation';
import { type addLog } from '@suite-common/logger';
import { type messageSystemActions } from '@suite-common/message-system';
import { type suiteSyncActions, type suiteSyncDataActions } from '@suite-common/suite-sync';
import { type suiteSyncQuotaManagerActions } from '@suite-common/suite-sync-quota-manager';
import { type thpActions } from '@suite-common/thp';
import { type notificationsActions } from '@suite-common/toast-notifications';
import {
    type discoveryActions,
    type feesActions,
    type phishingActions,
    type transactionsActions,
} from '@suite-common/wallet-core';
import {
    type BlockchainEvent,
    type DEVICE,
    type DeviceEvent,
    type TransportEvent,
    type UiEvent,
} from '@trezor/connect';
import { type FilterOutFromUnionByTypeProperty } from '@trezor/type-utils';

import type { OnboardingAction } from 'src/actions/onboarding/onboardingActions';
import type { BioAuthAction } from 'src/actions/suite/bioAuthActions';
import type { GuideAction } from 'src/actions/suite/guideActions';
import type { ProtocolAction } from 'src/actions/suite/protocolActions';
import type { StorageAction } from 'src/actions/suite/storageActions';
import type { SuiteAction } from 'src/actions/suite/suiteActions';
import type { WindowAction } from 'src/actions/suite/windowActions';
import type { AppState } from 'src/reducers/store';
import { type GlobalSendReceiveAction } from 'src/slices/wallet/globalSendReceiveFilters';
import type { WalletAction } from 'src/types/wallet';

import { type desktopBluetoothActions } from '../../actions/bluetooth/desktopBluetoothReducer';

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

export type PhishingAction = ReturnType<(typeof phishingActions)[keyof typeof phishingActions]>;

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
type DesktopBluetoothAction = ReturnType<
    (typeof desktopBluetoothActions)[keyof typeof desktopBluetoothActions]
>;
type FeatureFeedbackAction = ReturnType<
    (typeof featureFeedbackActions)[keyof typeof featureFeedbackActions]
>;
type SuiteSyncAction = ReturnType<(typeof suiteSyncActions)[keyof typeof suiteSyncActions]>;
type DesktopSuiteSyncAction = ReturnType<
    (typeof desktopSuiteSyncActions)[keyof typeof desktopSuiteSyncActions]
>;
type SuiteSyncDataAction = ReturnType<
    (typeof suiteSyncDataActions)[keyof typeof suiteSyncDataActions]
>;
type SuiteSyncQuotaManagerAction = ReturnType<
    (typeof suiteSyncQuotaManagerActions)[keyof typeof suiteSyncQuotaManagerActions]
>;
type DeviceActionDesktop = ReturnType<
    (typeof desktopDeviceActions)[keyof typeof desktopDeviceActions]
>;
type ThpAction = ReturnType<(typeof thpActions)[keyof typeof thpActions]>;
type GeolocationAction = ReturnType<(typeof geolocationActions)[keyof typeof geolocationActions]>;
type FeeAction = ReturnType<(typeof feesActions)[keyof typeof feesActions]>;
type FlagsAction = ReturnType<(typeof flagsActions)[keyof typeof flagsActions]>;
type SuiteSettingsAction = ReturnType<
    (typeof suiteSettingsActions)[keyof typeof suiteSettingsActions]
>;
type RecoveryAction = ReturnType<(typeof recoveryActions)[keyof typeof recoveryActions]>;
type BackupAction = ReturnType<(typeof backupActions)[keyof typeof backupActions]>;
type DiscreetModeAction = ReturnType<
    (typeof discreetModeActions)[keyof typeof discreetModeActions]
>;
type DebugAction = ReturnType<(typeof debugActions)[keyof typeof debugActions]>;
type DesktopUpdateAction = ReturnType<
    (typeof desktopUpdateActions)[keyof typeof desktopUpdateActions]
>;

// all actions from all apps used to properly type Dispatch.
export type Action =
    | AnalyticsAction
    | BackupAction
    | DebugAction
    | DiscreetModeAction
    | BioAuthAction
    | BluetoothAction
    | DesktopBluetoothAction
    | DesktopUpdateAction
    | DeviceAction
    | FeatureFeedbackAction
    | DeviceActionDesktop
    | DiscoveryAction
    | FeeAction
    | FirmwareAction
    | FlagsAction
    | GeolocationAction
    | GuideAction
    | LockAction
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
    | SuiteSettingsAction
    | SuiteSyncAction
    | DesktopSuiteSyncAction
    | SuiteSyncDataAction
    | SuiteSyncQuotaManagerAction
    | ThpAction
    | TorAction
    | TransactionAction
    | PhishingAction
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

export enum DisplayMode {
    CHUNKS = 1,
    PAGINATED_TEXT,
    SINGLE_WRAPPED_TEXT,
}
