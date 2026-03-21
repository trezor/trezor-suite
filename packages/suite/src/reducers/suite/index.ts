import { featureFeedbackReducer } from '@suite/feature-feedback';
import { prepareFlagsReducer } from '@suite/flags';
import { type TranslationKey } from '@suite/intl';
import { locksReducer } from '@suite/locks';
import { metadataReducer } from '@suite/metadata';
import { modalReducer as modal } from '@suite/modal';
import { routerReducer } from '@suite/router';
import { prepareSuiteSettingsReducer } from '@suite/settings';
import { prepareAnalyticsReducer } from '@suite-common/analytics-redux';
import { prepareConnectPopupReducer } from '@suite-common/connect-popup';
import { logsSlice } from '@suite-common/logger';
import { prepareMessageSystemReducer } from '@suite-common/message-system';
import { createNotificationsReducer } from '@suite-common/toast-notifications';
import { prepareWalletConnectReducer } from '@suite-common/walletconnect';

import { deviceSlice } from 'src/actions/device/deviceSlice';
import { extraDependencies } from 'src/support/extraDependencies';

import desktopUpdate from './desktopUpdateReducer';
import guide from './guideReducer';
import protocol from './protocolReducer';
import suite from './suiteReducer';
import window from './windowReducer';

const analytics = prepareAnalyticsReducer(extraDependencies);
// Type annotation as a workaround for type-check error "The inferred type of 'default' cannot be named..."
const messageSystem = prepareMessageSystemReducer(extraDependencies);
const device = deviceSlice.prepareReducer(extraDependencies);
const flags = prepareFlagsReducer(extraDependencies);
const suiteSettings = prepareSuiteSettingsReducer(extraDependencies);
const connectPopupReducer = prepareConnectPopupReducer(extraDependencies);
const walletConnectReducer = prepareWalletConnectReducer(extraDependencies);

export default {
    suite,
    suiteSettings,
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
    desktopUpdate,
    messageSystem,
    guide,
    protocol,
    featureFeedback: featureFeedbackReducer,
    connectPopup: connectPopupReducer,
    walletConnect: walletConnectReducer,
};
