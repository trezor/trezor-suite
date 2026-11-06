import { useSelector } from 'react-redux';

import { selectTokenByNetworkAndContract } from '@suite-common/token';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';

import { TokenUrlBlur } from './TokenUrlBlur';

type TokenNameProps = {
    networkSymbol: NetworkSymbol;
    tokenContract: TokenAddress;
};

export const TokenName = ({ networkSymbol, tokenContract }: TokenNameProps) => {
    const token = useSelector((state: AccountsRootState) =>
        selectTokenByNetworkAndContract(state, networkSymbol, tokenContract),
    );

    const name = token?.name || token?.symbol || null;

    if (name === null) return null;

    return <TokenUrlBlur text={name} networkSymbol={networkSymbol} tokenContract={tokenContract} />;
};
