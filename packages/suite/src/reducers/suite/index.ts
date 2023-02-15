import { extraDependencies } from '@suite/support/extraDependencies';

import { prepareAnalyticsReducer } from '@suite-common/analytics';
import { notificationsReducer } from '@suite-common/toast-notifications';
import { logsSlice } from '@suite-common/logger';

import router from './routerReducer';
import suite from './suiteReducer';
import devices from './deviceReducer';
import modal from './modalReducer';
import resize from './resizeReducer';
import metadata from './metadataReducer';
import desktopUpdate from './desktopUpdateReducer';
import messageSystem from './messageSystemReducer';
import guide from './guideReducer';
import protocol from './protocolReducer';

const analyticsReducer = prepareAnalyticsReducer(extraDependencies);

export default {
    suite,
    router,
    modal,
    devices,
    logs: logsSlice.reducer,
    notifications: notificationsReducer,
    resize,
    analytics: analyticsReducer,
    metadata,
    desktopUpdate,
    messageSystem,
    guide,
    protocol,
};
