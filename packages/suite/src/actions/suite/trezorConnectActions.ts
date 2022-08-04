import { lockDevice } from '@suite-actions/suiteActions';
import { prepareConnectInitThunk } from '@suite-common/connect-init';
import { isWeb } from '@suite-utils/env';
import { resolveStaticPath } from '@trezor/utils';
import { selectEnabledNetworks } from '@wallet-reducers/settingsReducer';
import { selectIsPendingTransportEvent } from '@suite-reducers/deviceReducer';

const connectSrc = resolveStaticPath('connect/');
// 'https://localhost:8088/';
// 'https://connect.corp.sldev.cz/develop/';

const initSettings = {
    connectSrc,
    transportReconnect: true,
    debug: false,
    popup: false,
    webusb: isWeb(),
    manifest: {
        email: 'info@trezor.io',
        appUrl: '@trezor/suite',
    },
};

export const init = prepareConnectInitThunk({
    actions: {
        lockDevice,
    },
    selectors: {
        selectEnabledNetworks,
        selectIsPendingTransportEvent,
    },
    initSettings,
});
