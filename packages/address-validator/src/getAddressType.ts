import type { AddressType } from './addressType';
import type { NetworkSymbol } from './networkTypes';
import { resolveValidator } from './resolveValidator';

export function getAddressType(address: string, symbol: NetworkSymbol): AddressType | undefined {
    const validator = resolveValidator(symbol);

    return validator?.getAddressType(address, symbol);
}
