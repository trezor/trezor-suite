import { type NetworkSymbol } from '@suite-common/wallet-config';
import { validate } from '@trezor/address-validator';

import { getAddressNetworkType, getCoinFromTestnet } from './addressUtils';

export const isAddressValid = (address: string, symbol: NetworkSymbol) => {
    const networkType = getAddressNetworkType(symbol, address);
    const updatedSymbol = getCoinFromTestnet(symbol);

    return validate(address, updatedSymbol.toUpperCase(), networkType);
};
