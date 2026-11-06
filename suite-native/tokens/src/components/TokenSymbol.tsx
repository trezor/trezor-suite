import { useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { shouldUppercaseTokenSymbol } from '@suite-common/wallet-utils';
import { type TextProps } from '@suite-native/atoms';
import { type NetworkSymbol } from '@trezor/network-module-types';

import { TokenUrlBlur } from './TokenUrlBlur';

const MAX_SYMBOL_LENGTH = 10;

type TokenSymbolProps = Omit<TextProps, 'children'> & {
    networkSymbol: NetworkSymbol;
    contractAddress: TokenAddress;
    isInline?: boolean;
    isTruncated?: boolean;
};

export const TokenSymbol = ({
    networkSymbol,
    contractAddress,
    isTruncated = false,
    ...props
}: TokenSymbolProps) => {
    const token = useTokenMetadata(networkSymbol, contractAddress);
    const symbol =
        token?.standard && shouldUppercaseTokenSymbol({ standard: token.standard })
            ? (token.symbol ?? '').toUpperCase()
            : (token?.symbol ?? '');
    const displaySymbol =
        isTruncated && symbol.length > MAX_SYMBOL_LENGTH
            ? `${symbol.slice(0, MAX_SYMBOL_LENGTH)}...`
            : symbol;

    return (
        <TokenUrlBlur
            {...props}
            text={displaySymbol}
            networkSymbol={networkSymbol}
            contractAddress={contractAddress}
        />
    );
};
