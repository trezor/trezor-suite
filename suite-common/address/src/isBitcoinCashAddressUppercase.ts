import { hasBitcoinCashAddressPrefix } from './hasBitcoinCashAddressPrefix';

export const isBitcoinCashAddressUppercase = (address: string) =>
    hasBitcoinCashAddressPrefix(address) && /[A-Z]/.test(address);
