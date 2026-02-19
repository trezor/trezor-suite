import { isProduction } from '@suite-native/config';

const TRADING_URL_BASE_PRODUCTION = 'https://trezor.io/suite/deeplinks/trade';
const TRADING_URL_BASE_DEV = 'trezorsuite://trading';

// we don't want to expose custom scheme in production,
// but we want to use custom scheme for develop as dev app has different app package
export const TRADING_URL_BASE = isProduction() ? TRADING_URL_BASE_PRODUCTION : TRADING_URL_BASE_DEV;
export const TRADING_URL_DEFAULT_BACK = `${TRADING_URL_BASE}/back`;
