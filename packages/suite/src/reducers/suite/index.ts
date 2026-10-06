import { type ReducersMapObject, type UnknownAction } from '@reduxjs/toolkit';

import { type DebugState, prepareDebugReducer } from '@suite/debug';
import { type DesktopUpdateState, desktopUpdateReducer } from '@suite/desktop-update';
import { type DesktopDeviceState, prepareDesktopDeviceReducer } from '@suite/device';
import { type FeedbackFeatureName } from '@suite/experimental';
import { featureFeedbackReducer } from '@suite/feature-feedback';
import { type FlagsState, prepareFlagsReducer } from '@suite/flags';
import { type TranslationKey } from '@suite/intl';
import { type LocksState, locksReducer } from '@suite/locks';
import { metadataReducer } from '@suite/metadata';
import { type State as ModalState, modalReducer as modal } from '@suite/modal';
import { type RouterState, routerReducer } from '@suite/router';
import { type SuiteSettingsState, prepareSuiteSettingsReducer } from '@suite/settings';
import { type TorState, torReducer } from '@suite/tor';
import { type AnalyticsState, prepareAnalyticsReducer } from '@suite-common/analytics-redux';
import { type ConnectPopupState, prepareConnectPopupReducer } from '@suite-common/connect-popup';
import { type DiscreetModeState, discreetModeReducer } from '@suite-common/discreet-mode';
import { type FeatureFeedbackState } from '@suite-common/feedback';
import { type LogsSliceState, logsSlice } from '@suite-common/logger';
import { type MessageSystemState, prepareMessageSystemReducer } from '@suite-common/message-system';
import { type MetadataState } from '@suite-common/metadata-types';
import {
    type NotificationsState,
    createNotificationsReducer,
} from '@suite-common/toast-notifications';
import { type WalletConnectState, prepareWalletConnectReducer } from '@suite-common/walletconnect';

import { extraDependencies } from 'src/support/extraDependencies';

import guide, { type GuideState } from './guideReducer';
import protocol, { type ProtocolState } from './protocolReducer';
import suite, { type SuiteState } from './suiteReducer';
import window, { type WindowState } from './windowReducer';

const analytics = prepareAnalyticsReducer(extraDependencies);
const messageSystem = prepareMessageSystemReducer(extraDependencies);
const device = prepareDesktopDeviceReducer(extraDependencies);
const flags = prepareFlagsReducer(extraDependencies);
const suiteSettings = prepareSuiteSettingsReducer(extraDependencies);
const debug = prepareDebugReducer(extraDependencies);
const connectPopupReducer = prepareConnectPopupReducer(extraDependencies);
const walletConnectReducer = prepareWalletConnectReducer(extraDependencies);

export type SuiteReducersState = {
    suite: SuiteState;
    discreetMode: DiscreetModeState;
    tor: TorState;
    suiteSettings: SuiteSettingsState;
    debug: DebugState;
    flags: FlagsState;
    locks: LocksState;
    router: RouterState;
    modal: ModalState;
    device: DesktopDeviceState;
    logs: LogsSliceState;
    notifications: NotificationsState<TranslationKey>;
    window: WindowState;
    analytics: AnalyticsState;
    metadata: MetadataState;
    desktopUpdate: DesktopUpdateState;
    messageSystem: MessageSystemState;
    guide: GuideState;
    protocol: ProtocolState;
    featureFeedback: FeatureFeedbackState<FeedbackFeatureName>;
    connectPopup: ConnectPopupState;
    walletConnect: WalletConnectState;
};

export const suiteReducers: ReducersMapObject<SuiteReducersState, UnknownAction> = {
    suite,
    discreetMode: discreetModeReducer,
    tor: torReducer,
    suiteSettings,
    debug,
    flags,
    locks: locksReducer,
    router: routerReducer,
    modal,
    device,
    logs: logsSlice.reducer,
    notifications: createNotificationsReducer<TranslationKey>().reducer,
    window,
    analytics,
    metadata: metadataReducer,
    desktopUpdate: desktopUpdateReducer,
    messageSystem,
    guide,
    protocol,
    featureFeedback: featureFeedbackReducer,
    connectPopup: connectPopupReducer,
    walletConnect: walletConnectReducer,
};
