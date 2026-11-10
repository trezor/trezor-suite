import { shouldUppercaseTokenSymbol } from '@suite-common/wallet-utils';
import { extractUrlsFromText } from '@trezor/utils';

import { type TokenMetadata } from './TokenMetadataContext';

const MAX_DISPLAYED_SYMBOL_LENGTH = 10;

type DisplayedToken = Pick<TokenMetadata, 'name' | 'symbol' | 'standard'>;

type GetTokenDisplaySymbolOptions = {
    isTruncated?: boolean;
};

/** Shortens a long symbol for display; a URL stays whole so it is still detected and masked. */
export const truncateTokenSymbol = (symbol: string) => {
    const hasUrl = extractUrlsFromText(symbol).urls.length > 0;

    return !hasUrl && symbol.length > MAX_DISPLAYED_SYMBOL_LENGTH
        ? `${symbol.slice(0, MAX_DISPLAYED_SYMBOL_LENGTH)}...`
        : symbol;
};

/** The symbol a token is displayed with, or `null` when it has none. */
export const getTokenDisplaySymbol = (
    token: DisplayedToken | null | undefined,
    { isTruncated = false }: GetTokenDisplaySymbolOptions = {},
): string | null => {
    if (!token?.symbol) return null;

    const symbol = shouldUppercaseTokenSymbol(token) ? token.symbol.toUpperCase() : token.symbol;

    return isTruncated ? truncateTokenSymbol(symbol) : symbol;
};

/** The name a token is displayed with, falling back to its symbol, or `null` when it has neither. */
export const getTokenDisplayName = (token: DisplayedToken | null | undefined): string | null =>
    token?.name || token?.symbol || null;
