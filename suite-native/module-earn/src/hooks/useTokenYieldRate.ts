import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    getWrappedNativeYieldVaults,
    selectBestEnabledYieldVault,
} from '@suite-common/earn-stablecoin';
import { type YieldDtoV2, useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { type MessageSystemRootState } from '@suite-common/message-system';
import {
    getYieldVaultForOutputToken,
    getYieldVaultsForInputToken,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getApyPercent } from '@suite-common/wallet-utils';

import { useMessageSystemYield } from './useMessageSystemYield';
import { useStakingRate } from './useStakingRate';
import { type YieldRateLabelType, getYieldRateLabelType } from '../utils/getYieldRateLabelType';
import { getBestPromotedRate, isEarnPromoSymbol } from '../utils/promotedRateUtils';

/** `inactive` = token eligible for a deposit, `active` = vault receipt token already earning. */
export type TokenYieldRateVariant = 'inactive' | 'active';

export type TokenYieldRateToken = {
    contract: string;
    symbol?: string;
    decimals: number;
};

type UseTokenYieldRateParams = {
    account: Account;
    /** Native-coin rows pass no token — wrapped-native vaults match the native balance. */
    token?: TokenYieldRateToken;
    variant: TokenYieldRateVariant;
};

type TokenYieldRate = {
    apy: number;
    labelType: YieldRateLabelType;
};

const emptyVaults: YieldDtoV2[] = [];

/**
 * The rate a row may advertise — the best not-killed vault matching the token, or for a
 * native-coin row the higher of that vault and staking. `null` when there is nothing to
 * advertise.
 */
export const useTokenYieldRate = ({
    account,
    token,
    variant,
}: UseTokenYieldRateParams): TokenYieldRate | null => {
    const yieldDepositMessageSystem = useMessageSystemYield('deposit');
    const isYieldRateRelevant =
        account.networkType === 'ethereum' && !yieldDepositMessageSystem.isDisabled;

    const { data: vaults } = useAllYieldOpportunities({ enabled: isYieldRateRelevant });

    const networkSymbol = account.symbol;
    const tokenContract = token?.contract;
    const tokenSymbol = token?.symbol;
    const tokenDecimals = token?.decimals;

    const matchedVaults = useMemo(() => {
        if (!isYieldRateRelevant) {
            return emptyVaults;
        }

        if (tokenContract === undefined || tokenDecimals === undefined) {
            return getWrappedNativeYieldVaults({ vaults, networkSymbol });
        }

        const heldToken = {
            address: tokenContract,
            symbol: tokenSymbol ?? '',
            decimals: tokenDecimals,
        };

        if (variant === 'active') {
            const vault = getYieldVaultForOutputToken({
                vaults,
                networkSymbol,
                token: heldToken,
            });

            return vault ? [vault] : emptyVaults;
        }

        return getYieldVaultsForInputToken({ vaults, networkSymbol, token: heldToken });
    }, [
        isYieldRateRelevant,
        vaults,
        networkSymbol,
        tokenContract,
        tokenSymbol,
        tokenDecimals,
        variant,
    ]);

    const bestVault = useSelector((state: MessageSystemRootState) =>
        selectBestEnabledYieldVault(state, matchedVaults),
    );

    // The native coin can also earn by staking, which is what the account's promo banner
    // advertises — the row must not undersell it with the vault rate alone.
    const { rate: stakingRate } = useStakingRate({
        symbol: networkSymbol,
        accountKey: account.key,
    });
    const promotedStakingRate =
        tokenContract === undefined && isEarnPromoSymbol(networkSymbol) ? stakingRate : null;

    return useMemo(() => {
        const vaultApy = bestVault ? getApyPercent(bestVault.rewardRate.total) : null;
        const bestRate = getBestPromotedRate({ vaultApy, stakingRate: promotedStakingRate });

        if (!bestRate) {
            return null;
        }

        return {
            apy: bestRate.apy,
            labelType:
                bestRate.isVaultRate && bestVault
                    ? getYieldRateLabelType(bestVault.rewardRate)
                    : 'apy',
        };
    }, [bestVault, promotedStakingRate]);
};
