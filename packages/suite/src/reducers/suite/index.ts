import { Reducer } from '@reduxjs/toolkit';

import { prepareAnalyticsReducer } from '@suite-common/analytics';
import { prepareMessageSystemReducer } from '@suite-common/message-system';
import { notificationsReducer } from '@suite-common/toast-notifications';
import { logsSlice } from '@suite-common/logger';
import { prepareDeviceReducer } from '@suite-common/wallet-core';

import { extraDependencies } from 'src/support/extraDependencies';

import router from './routerReducer';
import suite from './suiteReducer';
import modal from './modalReducer';
import resize from './resizeReducer';
import metadata from './metadataReducer';
import desktopUpdate from './desktopUpdateReducer';
import guide from './guideReducer';
import protocol from './protocolReducer';

const analytics = prepareAnalyticsReducer(extraDependencies);
// Type annotation as workaround for typecheck error "The inferred type of 'default' cannot be named..."
const messageSystem: Reducer = prepareMessageSystemReducer(extraDependencies);
const device = prepareDeviceReducer(extraDependencies);
export default {
    suite,
    router,
    modal,
    device,
    logs: logsSlice.reducer,
    notifications: notificationsReducer,
    resize,
    analytics,
    metadata,
    desktopUpdate,
    messageSystem,
    guide,
    protocol,
};
