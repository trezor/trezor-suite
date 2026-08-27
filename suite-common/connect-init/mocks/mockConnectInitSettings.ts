import { type ConnectInitSettings } from '@suite-common/suite-types';

export const mockConnectInitSettings = (): ConnectInitSettings => ({
    debug: false,
    manifest: {
        email: 'info@trezor.io',
        appName: 'Trezor Suite test',
        appUrl: '@suite-common/connect-init',
    },
});
