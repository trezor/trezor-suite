import { useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { shouldUppercaseTokenSymbol } from '@suite-common/wallet-utils';
import { type TextProps } from '@suite-native/atoms';
import { type NetworkSymbol } from '@trezor/network-module-types';
import { extractUrlsFromText } from '@trezor/utils';

import { UNKNOWN_TOKEN_LABEL } from '../utils';
import { TokenUrlBlur } from './TokenUrlBlur';

const MAX_SYMBOL_LENGTH = 10;

const getDisplaySymbol = (symbol: string, isTruncated: boolean) => {
    // Truncating a URL can break its detection and leave the rest of it unmasked.
    const isTruncatable = extractUrlsFromText(symbol).urls.length === 0;

    return isTruncated && isTruncatable && symbol.length > MAX_SYMBOL_LENGTH
        ? `${symbol.slice(0, MAX_SYMBOL_LENGTH)}...`
        : symbol;
};

type TokenSymbolProps = Omit<TextProps, 'children'> & {
    networkSymbol: NetworkSymbol;
    contractAddress: TokenAddress;
    isTruncated?: boolean;
};

export const TokenSymbol = ({
    networkSymbol,
    contractAddress,
    isTruncated = false,
    ...props
}: TokenSymbolProps) => {
    const token = useTokenMetadata(networkSymbol, contractAddress);
    const text = token?.symbol
        ? getDisplaySymbol(
              shouldUppercaseTokenSymbol(token) ? token.symbol.toUpperCase() : token.symbol,
              isTruncated,
          )
        : UNKNOWN_TOKEN_LABEL;

    return (
        <TokenUrlBlur
            {...props}
            text={text}
            networkSymbol={networkSymbol}
            contractAddress={contractAddress}
        />
    );
};
