import { Translation } from '@suite/intl';
import { getTokenDisplaySymbol, useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';

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
    const displaySymbol = getTokenDisplaySymbol(token, { isTruncated });

    if (displaySymbol === null) return <Translation id="TR_UNKNOWN_TOKEN" />;

    return (
        <TokenUrlBlur
            text={displaySymbol}
            networkSymbol={networkSymbol}
            tokenContract={tokenContract}
        />
    );
};
