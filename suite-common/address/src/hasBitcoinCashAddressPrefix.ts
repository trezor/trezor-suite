export const hasBitcoinCashAddressPrefix = (address: string) =>
    address.toLowerCase().startsWith('bitcoincash:');
