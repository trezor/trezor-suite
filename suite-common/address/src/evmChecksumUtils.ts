import { checksumAddress, getAddress, isAddress } from 'viem';

export const toChecksumAddress = (address: string) => getAddress(address);

// Note: isAddress with { strict: true } cannot be used as, contrary to documentation,
// even strict mode doesn't check lowercase addresses (https://viem.sh/docs/utilities/isAddress)
export const checkAddressChecksum = (address: string) =>
    isAddress(address, { strict: false }) && address === checksumAddress(address);
