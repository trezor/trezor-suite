import { prepareAnalyticsReducer } from '@suite-common/analytics';
import { prepareConnectPopupReducer } from '@suite-common/connect-popup';
import { logsSlice } from '@suite-common/logger';
import { prepareMessageSystemReducer } from '@suite-common/message-system';
import { notificationsReducer } from '@suite-common/toast-notifications';
import { prepareDeviceReducer } from '@suite-common/wallet-core';
import { prepareWalletConnectReducer } from '@suite-common/walletconnect';

import { extraDependencies } from 'src/support/extraDependencies';

import desktopUpdate from './desktopUpdateReducer';
import guide from './guideReducer';
import metadata from './metadataReducer';
import modal from './modalReducer';
import protocol from './protocolReducer';
import router from './routerReducer';
import suite from './suiteReducer';
import window from './windowReducer';

const analytics = prepareAnalyticsReducer(extraDependencies);
// Type annotation as a workaround for type-check error "The inferred type of 'default' cannot be named..."
const messageSystem = prepareMessageSystemReducer(extraDependencies);
const device = prepareDeviceReducer(extraDependencies);
const connectPopupReducer = prepareConnectPopupReducer(extraDependencies);
const walletConnectReducer = prepareWalletConnectReducer(extraDependencies);

export default {
    suite,
    router,
    modal,
    device,
    logs: logsSlice.reducer,
    notifications: notificationsReducer,
    window,
    analytics,
    metadata,
    desktopUpdate,
    messageSystem,
    guide,
    protocol,
    connectPopup: connectPopupReducer,
    walletConnect: walletConnectReducer,
};
