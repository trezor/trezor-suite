import { useMemo } from 'react';

import { Feature, selectIsFeatureEnabled } from '@suite-common/message-system';
import { selectAccountIsStakingActive, selectCardanoPoolsInfo } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    getAccountTotalStakingBalance,
    getStakingLimitsByNetworkSymbol,
    isCardanoStakedOutsideEverstake,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

export type StakingAccountStatus =
    | 'insufficient-funds'
    | 'staking-active'
    | 'staking-inactive'
    | 'staking-max'
    | 'staked-but-insufficient-funds'
    | 'staking-outdated-provider';

export const useStakingAccountStatus = (account: Account): StakingAccountStatus => {
    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, account.key));
    const cardanoStakingPools = useSelector(selectCardanoPoolsInfo);
    const isNewProviderBannerEnabled = useSelector(state =>
        selectIsFeatureEnabled(state, Feature.banners.staking.ada.newProvider, true),
    );

    const accountBalance = account.formattedBalance;
    const stakingBalance = getAccountTotalStakingBalance(account) ?? '0';
    const isCardanoNetworkType = account.networkType === 'cardano';
    const minStakingAmount = getStakingLimitsByNetworkSymbol(
        account.symbol,
    )?.MIN_AMOUNT_FOR_STAKING_DASHBOARD;

    return useMemo(() => {
        if (
            isCardanoStakedOutsideEverstake(account, cardanoStakingPools) &&
            isNewProviderBannerEnabled
        ) {
            return 'staking-outdated-provider';
        }

        if (
            (accountBalance === '0' && stakingBalance !== '0') ||
            (isCardanoNetworkType && isStakingActive)
        ) {
            return 'staking-max';
        }

        const hasEnoughBalanceForStaking =
            minStakingAmount && new BigNumber(accountBalance).gte(minStakingAmount);

        if (stakingBalance !== '0') {
            if (!hasEnoughBalanceForStaking) {
                return 'staked-but-insufficient-funds';
            }

            return 'staking-active';
        }

        if (!hasEnoughBalanceForStaking) {
            return 'insufficient-funds';
        }

        return 'staking-inactive';
    }, [
        account,
        accountBalance,
        stakingBalance,
        minStakingAmount,
        isCardanoNetworkType,
        isStakingActive,
        cardanoStakingPools,
        isNewProviderBannerEnabled,
    ]);
};
