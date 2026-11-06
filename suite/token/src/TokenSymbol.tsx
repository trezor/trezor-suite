import { useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol, getDisplaySymbol } from '@suite-common/wallet-config';

import { TokenUrlBlur } from './TokenUrlBlur';

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
    const symbol = token?.symbol ?? '';
    const displaySymbol = isTruncated ? getDisplaySymbol(symbol, tokenContract) : symbol;

    return (
        <TokenUrlBlur
            text={displaySymbol}
            networkSymbol={networkSymbol}
            tokenContract={tokenContract}
        />
    );
};
