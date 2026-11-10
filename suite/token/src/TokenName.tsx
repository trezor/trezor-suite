import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { getTokenDisplayName, useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { TokenUrlBlur } from './TokenUrlBlur';

type TokenNameProps = {
    networkSymbol: NetworkSymbol;
    tokenContract: TokenAddress;
    /** Shown without token metadata, e.g. for a catalog token the user does not hold. */
    fallback?: ReactNode;
};

export const TokenName = ({ networkSymbol, tokenContract, fallback = null }: TokenNameProps) => {
    const token = useTokenMetadata(networkSymbol, tokenContract);

    if (!token) return fallback;

    const name = getTokenDisplayName(token);

    if (name === null) return <Translation id="TR_UNKNOWN_TOKEN" />;

    return <TokenUrlBlur text={name} networkSymbol={networkSymbol} tokenContract={tokenContract} />;
};
