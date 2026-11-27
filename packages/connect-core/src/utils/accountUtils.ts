//  origin: https://github.com/trezor/connect/blob/develop/src/js/utils/accountUtils.js

import type { CoinInfo } from '@trezor/connect-common';

export const isUtxoBased = (coinInfo: CoinInfo) =>
    coinInfo.type === 'bitcoin' || coinInfo.shortcut === 'ADA' || coinInfo.shortcut === 'tADA';
