import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectBestEnabledYieldVault } from '@suite-common/earn-stablecoin';
import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    getYieldVaultForOutputToken,
    getYieldVaultsForInputToken,
    hasYieldVaultPosition,
} from '@suite-common/wallet-core';
import { getApyPercent } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { exhaustive } from '@trezor/type-utils';

interface YieldBadgeData {
    apy: number;
    vaultId: string;
    hasVaultPosition: boolean;
}

interface UseYieldBadgeProps {
    networkSymbol?: NetworkSymbol;
    token?: TokenInfo;
    accountTokens: TokenInfo[] | undefined;
    type: 'default' | 'defi';
    yieldOpportunities?: YieldDtoV2[];
}

export const useYieldBadge = ({
    networkSymbol,
    token,
    accountTokens,
    type,
    yieldOpportunities,
}: UseYieldBadgeProps): YieldBadgeData | null => {
    const matchedVaults = useMemo(() => {
        if (!networkSymbol || !token?.symbol) return [];

        const heldToken = {
            address: token.contract,
            symbol: token.symbol,
            decimals: token.decimals,
        };

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
            default:
                return exhaustive(type);
        }
    }, [yieldOpportunities, networkSymbol, token, type]);

    const vaultsWithPosition = useMemo(
        () =>
            networkSymbol
                ? matchedVaults.filter(vault =>
                      hasYieldVaultPosition({ networkSymbol, vault, accountTokens }),
                  )
                : [],
        [matchedVaults, networkSymbol, accountTokens],
    );

    const bestEnabledVault = useSelector((state: MessageSystemRootState) =>
        selectBestEnabledYieldVault(
            state,
            vaultsWithPosition.length > 0 ? vaultsWithPosition : matchedVaults,
        ),
    );

    if (!bestEnabledVault) {
        return null;
    }

    const apy = getApyPercent(bestEnabledVault.rewardRate.total);

    if (apy === null) {
        return null;
    }

    return {
        apy,
        vaultId: bestEnabledVault.id,
        hasVaultPosition: vaultsWithPosition.includes(bestEnabledVault),
    };
};
