import type { NetworkSymbol } from './networkTypes';
import { resolveValidator } from './resolveValidator';

export function isAddressValid(address: string, symbol: NetworkSymbol): boolean {
    return resolveValidator(symbol)?.isAddressValid(address, symbol) ?? false;
}
