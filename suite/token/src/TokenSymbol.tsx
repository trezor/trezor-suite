import { useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { extractUrlsFromText } from '@trezor/utils';

import { TokenUrlBlur } from './TokenUrlBlur';

const MAX_SYMBOL_LENGTH = 10;

const getDisplaySymbol = (symbol: string, isTruncated: boolean) => {
    // Truncating a URL can break its detection and leave the rest of it unmasked.
    const isTruncatable = extractUrlsFromText(symbol).urls.length === 0;

    return isTruncated && isTruncatable && symbol.length > MAX_SYMBOL_LENGTH
        ? `${symbol.slice(0, MAX_SYMBOL_LENGTH)}...`
        : symbol;
};

type TokenSymbolProps = {
    networkSymbol: NetworkSymbol;
    tokenContract: TokenAddress;
    isTruncated?: boolean;
};

export const TokenSymbol = ({
    networkSymbol,
    tokenContract,
    isTruncated = false,
}: TokenSymbolProps) => {
    const token = useTokenMetadata(networkSymbol, tokenContract);
    const displaySymbol = getDisplaySymbol(token?.symbol ?? '', isTruncated);

    return (
        <TokenUrlBlur
            text={displaySymbol}
            networkSymbol={networkSymbol}
            tokenContract={tokenContract}
        />
    );
};
