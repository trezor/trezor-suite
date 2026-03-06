import { experimentalFeedbackReducer } from '@suite/experimental-feedback';
import { TranslationKey } from '@suite/intl';
import { metadataReducer } from '@suite/metadata';
import { modalReducer as modal } from '@suite/modal';
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
import router from './routerReducer';
import suite from './suiteReducer';
import window from './windowReducer';

const analytics = prepareAnalyticsReducer(extraDependencies);
// Type annotation as a workaround for type-check error "The inferred type of 'default' cannot be named..."
const messageSystem = prepareMessageSystemReducer(extraDependencies);
const device = deviceSlice.prepareReducer(extraDependencies);
const connectPopupReducer = prepareConnectPopupReducer(extraDependencies);
const walletConnectReducer = prepareWalletConnectReducer(extraDependencies);

export default {
    suite,
    router,
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
    experimentalFeedback: experimentalFeedbackReducer,
    connectPopup: connectPopupReducer,
    walletConnect: walletConnectReducer,
};
