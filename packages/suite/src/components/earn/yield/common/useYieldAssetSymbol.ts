import { useMemo } from 'react';

import { selectTradingCoinSymbolByCryptoId, toTokenCryptoId } from '@suite-common/trading';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';

type UseYieldAssetSymbolProps = {
    account?: Account | null;
    contractAddress?: string;
};

export const useYieldAssetSymbol = ({
    account,
    contractAddress,
}: UseYieldAssetSymbolProps): string | undefined => {
    const normalizedContractAddress =
        account && contractAddress
            ? getContractAddressForNetworkSymbol(account.symbol, contractAddress)
            : undefined;

    const tokenSymbolFromAccount = useMemo(
        () =>
            account?.tokens?.find(
                token =>
                    normalizedContractAddress !== undefined &&
                    token.contract !== undefined &&
                    getContractAddressForNetworkSymbol(account.symbol, token.contract) ===
                        normalizedContractAddress,
            )?.symbol,
        [account, normalizedContractAddress],
    );

    const tokenCryptoId =
        account && normalizedContractAddress
            ? toTokenCryptoId(account.symbol, normalizedContractAddress)
            : undefined;

    const tokenSymbolFromTrading = useSelector(state =>
        selectTradingCoinSymbolByCryptoId(state, tokenCryptoId),
    );
    const resolvedTokenSymbolFromTrading = tokenSymbolFromTrading ?? undefined;

    if (!account) {
        return;
    }

    return (
        tokenSymbolFromAccount ??
        resolvedTokenSymbolFromTrading ??
        getNetworkDisplaySymbol(account.symbol)
    );
};
