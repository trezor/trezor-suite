import { prepareDebugReducer } from '@suite/debug';
import { desktopUpdateReducer } from '@suite/desktop-update';
import { featureFeedbackReducer } from '@suite/feature-feedback';
import { prepareFlagsReducer } from '@suite/flags';
import { type TranslationKey } from '@suite/intl';
import { locksReducer } from '@suite/locks';
import { metadataReducer } from '@suite/metadata';
import { modalReducer as modal } from '@suite/modal';
import { routerReducer } from '@suite/router';
import { prepareSuiteSettingsReducer } from '@suite/settings';
import { torReducer } from '@suite/tor';
import { prepareAnalyticsReducer } from '@suite-common/analytics-redux';
import { prepareConnectPopupReducer } from '@suite-common/connect-popup';
import { discreetModeReducer } from '@suite-common/discreet-mode';
import { logsSlice } from '@suite-common/logger';
import { prepareMessageSystemReducer } from '@suite-common/message-system';
import { createNotificationsReducer } from '@suite-common/toast-notifications';
import { prepareWalletConnectReducer } from '@suite-common/walletconnect';

import { prepareDesktopDeviceReducer } from 'src/actions/device/deviceSlice';
import { extraDependencies } from 'src/support/extraDependencies';

import guide from './guideReducer';
import protocol from './protocolReducer';
import suite from './suiteReducer';
import window from './windowReducer';

const analytics = prepareAnalyticsReducer(extraDependencies);
// Type annotation as a workaround for type-check error "The inferred type of 'default' cannot be named..."
const messageSystem = prepareMessageSystemReducer(extraDependencies);
const device = prepareDesktopDeviceReducer(extraDependencies);
const flags = prepareFlagsReducer(extraDependencies);
const suiteSettings = prepareSuiteSettingsReducer(extraDependencies);
const debug = prepareDebugReducer(extraDependencies);
const connectPopupReducer = prepareConnectPopupReducer(extraDependencies);
const walletConnectReducer = prepareWalletConnectReducer(extraDependencies);

export default {
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
