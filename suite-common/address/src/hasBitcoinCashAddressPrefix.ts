export const hasBitcoinCashAddressPrefix = (address: string) =>
    /^bitcoincash:/.test(address.toLowerCase());
