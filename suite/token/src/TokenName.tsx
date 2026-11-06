import { useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { TokenUrlBlur } from './TokenUrlBlur';

type TokenNameProps = {
    networkSymbol: NetworkSymbol;
    tokenContract: TokenAddress;
};

export const TokenName = ({ networkSymbol, tokenContract }: TokenNameProps) => {
    const token = useTokenMetadata(networkSymbol, tokenContract);

    const name = token?.name || token?.symbol || null;

    if (name === null) return null;

    return <TokenUrlBlur text={name} networkSymbol={networkSymbol} tokenContract={tokenContract} />;
};
