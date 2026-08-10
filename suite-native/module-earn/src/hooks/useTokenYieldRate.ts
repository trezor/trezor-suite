import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type YieldDtoV2, useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { type MessageSystemRootState } from '@suite-common/message-system';
import {
    getYieldVaultForOutputToken,
    getYieldVaultsForInputToken,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getApyPercent } from '@suite-common/wallet-utils';

import { useMessageSystemYield } from './useMessageSystemYield';
import { selectBestEnabledYieldVault } from '../selectors';
import { getWrappedNativeYieldVaults } from '../utils/getWrappedNativeYieldVaults';
import { type YieldRateLabelType, getYieldRateLabelType } from '../utils/getYieldRateLabelType';

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
 * The yield rate a token row may advertise — the rate of the best not-killed vault
 * matching the token, or `null` when there is nothing to advertise.
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

    return useMemo(() => {
        if (!bestVault) {
            return null;
        }

        const apy = getApyPercent(bestVault.rewardRate.total);

        if (apy === null) {
            return null;
        }

        return {
            apy,
            labelType: getYieldRateLabelType(bestVault.rewardRate),
        };
    }, [bestVault]);
};
