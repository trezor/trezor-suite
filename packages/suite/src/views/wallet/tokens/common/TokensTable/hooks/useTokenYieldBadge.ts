import { useMemo } from 'react';

import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type EnhancedTokenInfo } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    getYieldVaultForOutputToken,
    getYieldVaultsForInputToken,
} from '@suite-common/wallet-core';
import { getApyPercent } from '@suite-common/wallet-utils';
import { exhaustive } from '@trezor/type-utils';

import { getBestEnabledYieldVault } from 'src/components/earn/utils/yieldVaultUtils';
import { useSelector } from 'src/hooks/suite';

import type { TokensTableType } from '../types';

type UseTokenYieldBadgeParams = {
    networkSymbol: NetworkSymbol;
    token: EnhancedTokenInfo;
    type: TokensTableType;
    yieldOpportunities?: YieldDtoV2[];
};

type TokenYieldBadgeData = {
    apy: number;
    vaultId: string;
};

export const useTokenYieldBadge = ({
    networkSymbol,
    token,
    type,
    yieldOpportunities,
}: UseTokenYieldBadgeParams): TokenYieldBadgeData | null => {
    const matchedVaults = useMemo(() => {
        const heldToken = {
            address: token.contract,
            symbol: token.symbol ?? '',
            decimals: token.decimals,
        };

        // On the DeFi tab the row is a vault receipt token, on the Tokens tab it is a
        // potential vault deposit. The unverified table never advertises yield; the
        // hidden-tokens tables stay badge-free because they pass no yield opportunities.
        switch (type) {
            case 'defi': {
                const vault = getYieldVaultForOutputToken({
                    vaults: yieldOpportunities,
                    networkSymbol,
                    token: heldToken,
                });

                return vault ? [vault] : [];
            }
            case 'default':
                return getYieldVaultsForInputToken({
                    vaults: yieldOpportunities,
                    networkSymbol,
                    token: heldToken,
                });
            case 'hidden':
                return [];
            default:
                return exhaustive(type);
        }
    }, [yieldOpportunities, networkSymbol, token.contract, token.symbol, token.decimals, type]);

    const bestEnabledVault = useSelector(state => getBestEnabledYieldVault(state, matchedVaults));

    if (!bestEnabledVault) {
        return null;
    }

    const apy = getApyPercent(bestEnabledVault.rewardRate.total);

    if (apy === null) {
        return null;
    }

    return { apy, vaultId: bestEnabledVault.id };
};
