import { type NetworkSymbol } from '@suite-common/wallet-config';
import { getAddressType } from '@trezor/address-validator';

import { getAddressNetworkType, getCoinFromTestnet } from './addressUtils';

export const isTaprootAddress = (address: string, symbol: NetworkSymbol) => {
    const networkType = getAddressNetworkType(symbol, address);
    const updatedSymbol = getCoinFromTestnet(symbol);

    return getAddressType(address, updatedSymbol.toUpperCase(), networkType) === 'p2tr';
};
