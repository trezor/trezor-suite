import { isNative } from '@trezor/env-utils';

export const WALLETCONNECT_MODULE = '@suite/walletconnect';

export const PROJECT_ID = '203549d0480d0f24d994780f34889b03';

// EIP-3326 error for wallet_switchEthereumChain when the wallet does not know the chain.
export const UNRECOGNIZED_CHAIN_ERROR_CODE = 4902;

// Generic JSON-RPC error code that Suite sends when a request fails for another reason.
export const GENERIC_REQUEST_ERROR_CODE = 1;

export const WALLETCONNECT_METADATA = {
    name: 'Trezor Suite',
    description: 'Manage your Trezor device',
    url: 'https://suite.trezor.io',
    icons: ['https://trezor.io/images/suite/appIcon.png'],
    redirect: isNative()
        ? {
              native: 'trezorsuite://walletconnect/',
              universal: 'https://connect.trezor.io/9/deeplink/wc',
              linkMode: true,
          }
        : {},
};
