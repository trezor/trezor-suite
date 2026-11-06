import { useSelector } from 'react-redux';

import { selectTokenByNetworkAndContract } from '@suite-common/token';
import { type NetworkSymbol, getDisplaySymbol } from '@suite-common/wallet-config';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';

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
    const token = useSelector((state: AccountsRootState) =>
        selectTokenByNetworkAndContract(state, networkSymbol, tokenContract),
    );
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
