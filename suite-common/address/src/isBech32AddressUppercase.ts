export const isBech32AddressUppercase = (address: string) =>
    /^(bc1|tb1|ltc1|vtc1)/.test(address.toLowerCase()) && /[A-Z]/.test(address);
