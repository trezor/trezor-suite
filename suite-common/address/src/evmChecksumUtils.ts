import { checksumAddress, getAddress, isAddress, isAddressEqual } from 'viem';

export const toChecksumAddress = (address: string) => getAddress(address);

// Shape check only — checksums are not enforced, so a lowercase paste still qualifies.
export const isEvmAddress = (address: string) => isAddress(address.trim(), { strict: false });

// Note: isAddress with { strict: true } cannot be used as, contrary to documentation,
// even strict mode doesn't check lowercase addresses (https://viem.sh/docs/utilities/isAddress)
export const checkAddressChecksum = (address: string) =>
    isAddress(address, { strict: false }) && address === checksumAddress(address);

// Checksum-agnostic EVM address equality. Missing or invalid input yields `false`, so callers
// can compare untrusted addresses without pre-validating them.
export const areEvmAddressesEqual = (a?: string | null, b?: string | null): boolean =>
    !!a &&
    !!b &&
    isAddress(a, { strict: false }) &&
    isAddress(b, { strict: false }) &&
    isAddressEqual(a, b);
