import type { EthereumNetworkSymbol } from '@trezor/network-ethereum/constants';

/**
 * Networks whose names can be resolved, mapped to the chain id that selects the ENSIP-11 reverse
 * namespace. ENS runs on mainnet and Sepolia only, so every other EVM symbol is left out.
 */
const NAMED_ADDRESS_CHAIN_ID: Partial<Record<EthereumNetworkSymbol, number>> = {
    eth: 1,
    tsep: 11155111,
};

export const getNamedAddressChainId = (symbol: EthereumNetworkSymbol) =>
    NAMED_ADDRESS_CHAIN_ID[symbol];

export const supportsNamedAddress = (symbol: EthereumNetworkSymbol) =>
    getNamedAddressChainId(symbol) !== undefined;

const MIN_CHARS_AFTER_LAST_DOT = 2;

export const isNameLike = (value: string) => {
    if (!value) return false;
    const trimmed = value.trim();
    if (!trimmed.includes('.')) return false;
    if (/\s/.test(trimmed)) return false;

    const lastDotIndex = trimmed.lastIndexOf('.');
    if (lastDotIndex === -1) return false;

    const charsAfterLastDot = trimmed.length - lastDotIndex - 1;
    if (charsAfterLastDot < MIN_CHARS_AFTER_LAST_DOT) return false;

    return true;
};

const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

// Shape check only — checksums are not enforced, so a lowercase paste still qualifies.
export const isAddressLike = (value: string) => EVM_ADDRESS_REGEX.test(value.trim());
