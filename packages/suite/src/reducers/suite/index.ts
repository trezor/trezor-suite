import router from './routerReducer';
import suite from './suiteReducer';
import devices from './deviceReducer';
import modal from './modalReducer';
import logs from './logsReducer';
import { notificationsReducer } from '@suite-common/toast-notifications';
import resize from './resizeReducer';
import analytics from './analyticsReducer';
import metadata from './metadataReducer';
import desktopUpdate from './desktopUpdateReducer';
import messageSystem from './messageSystemReducer';
import guide from './guideReducer';
import protocol from './protocolReducer';

export default {
    suite,
    router,
    modal,
    devices,
    logs,
    notifications: notificationsReducer,
    resize,
    analytics,
    metadata,
    desktopUpdate,
    messageSystem,
    guide,
    protocol,
};
