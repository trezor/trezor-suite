import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type YieldDtoV2, useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import {
    Feature,
    type MessageSystemRootState,
    selectIsYieldFeatureDisabled,
} from '@suite-common/message-system';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { getYieldVaultsForInputToken } from '@suite-common/wallet-core';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
import { getApyPercent } from '@suite-common/wallet-utils';

import { getWrappedNativeYieldVaults } from './getWrappedNativeYieldVaults';
import { selectBestEnabledYieldVault } from './yieldVaultSelectors';

const NO_VAULTS: YieldDtoV2[] = [];

type UseYieldVaultApyParams = {
    symbol: NetworkSymbol | undefined;
    contractAddress: TokenAddress | undefined;
    tokenSymbol: TokenSymbol | null;
    tokenDecimals: number | undefined;
};

export const useYieldVaultApy = ({
    symbol,
    contractAddress,
    tokenSymbol,
    tokenDecimals,
}: UseYieldVaultApyParams) => {
    const isDepositDisabled = useSelector((state: MessageSystemRootState) =>
        selectIsYieldFeatureDisabled(state, Feature.earn.yield.deposit),
    );
    const { data: vaults } = useAllYieldOpportunities({
        enabled:
            symbol !== undefined && getNetworkType(symbol) === 'ethereum' && !isDepositDisabled,
    });
    const assetVaults = useMemo(() => {
        if (symbol === undefined) {
            return NO_VAULTS;
        }

        return contractAddress === undefined
            ? getWrappedNativeYieldVaults({ vaults, networkSymbol: symbol })
            : getYieldVaultsForInputToken({
                  vaults,
                  networkSymbol: symbol,
                  token: {
                      address: contractAddress,
                      symbol: tokenSymbol ?? '',
                      decimals: tokenDecimals ?? 0,
                  },
              });
    }, [vaults, symbol, contractAddress, tokenSymbol, tokenDecimals]);
    const bestVault = useSelector((state: MessageSystemRootState) =>
        selectBestEnabledYieldVault(state, assetVaults),
    );

    return bestVault === null ? null : getApyPercent(bestVault.rewardRate.total);
};
