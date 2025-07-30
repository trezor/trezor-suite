import { isNative } from '@trezor/env-utils';

export const WALLETCONNECT_MODULE = '@suite/walletconnect';

export const PROJECT_ID = '203549d0480d0f24d994780f34889b03';

export const WALLETCONNECT_METADATA = {
    name: 'Trezor Suite',
    description: 'Manage your Trezor device',
    url: 'https://suite.trezor.io',
    icons: ['https://trezor.io/images/suite/appIcon.png'],
    redirect: isNative()
        ? {
              native: 'trezorsuitelite://walletconnect/',
              linkMode: true,
          }
        : {},
};
