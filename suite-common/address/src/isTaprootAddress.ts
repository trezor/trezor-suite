import { type NetworkSymbol } from '@suite-common/wallet-config';
import { getAddressType } from '@trezor/address-validator';

export const isTaprootAddress = (address: string, symbol: NetworkSymbol) =>
    getAddressType(address, symbol) === 'p2tr';
