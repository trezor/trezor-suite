import router from './routerReducer';
import suite from './suiteReducer';
import devices from './deviceReducer';
import modal from './modalReducer';
import log from './logReducer';
import notifications from './notificationReducer';
import resize from './resizeReducer';
import analytics from './analyticsReducer';
import metadata from './metadataReducer';

export default {
    suite,
    router,
    modal,
    devices,
    log,
    notifications,
    resize,
    analytics,
    metadata,
};
