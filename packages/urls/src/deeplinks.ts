import { type SuiteDeeplink } from './types';

export const SUITE_BRIDGE_DEEPLINK: SuiteDeeplink = 'trezorsuite://bridge-requested-by-a-3rd-party';
export const SUITE_WALLETCONNECT_DEEPLINK: SuiteDeeplink = 'trezorsuite://walletconnect';
export const SUITE_ANCHOR_DEEPLINK_PREFIX: SuiteDeeplink = 'trezorsuite://anchor-';
export const SUITE_GUIDE_SUPPORT_DEEPLINK: SuiteDeeplink = 'trezorsuite://guide-support';

export const SUITE_TRADING_REDIRECT_DEEPLINKS: SuiteDeeplink[] = [
    'trezorsuite://buy-redirect',
    'trezorsuite://sell-redirect',
    'trezorsuite://exchange-redirect',
];
