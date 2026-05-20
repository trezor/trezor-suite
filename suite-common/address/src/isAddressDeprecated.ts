import { type NetworkSymbol } from '@suite-common/wallet-config';

import { isAddressValid } from './isAddressValid';

export const isAddressDeprecated = (address: string, symbol: NetworkSymbol) => {
    // catch deprecated address formats
    // LTC starting with "3" and valid with a BTC format
    if (symbol === 'ltc' && address.startsWith('3') && isAddressValid(address, 'btc')) {
        return 'LTC_ADDRESS_INFO_URL';
    }
    // BCH starting with "1" and valid with a BTC format
    if (symbol === 'bch' && address.startsWith('1') && isAddressValid(address, 'btc')) {
        return 'HELP_CENTER_CASHADDR_URL';
    }
};
