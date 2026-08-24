import { type NetworkSymbol } from '@suite-common/wallet-config';

const SUPPORTED_SYMBOLS: readonly NetworkSymbol[] = ['eth', 'tsep'] as const;

export const isSymbolSupportingNamedAddress = (symbol: NetworkSymbol) =>
    SUPPORTED_SYMBOLS.includes(symbol);

const MIN_CHARS_AFTER_LAST_DOT = 2;

export const looksLikeNamedAddress = (value: string) => {
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
export const looksLikeEvmAddress = (value: string) => EVM_ADDRESS_REGEX.test(value.trim());
