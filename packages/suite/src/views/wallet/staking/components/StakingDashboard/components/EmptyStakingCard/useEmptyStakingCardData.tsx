import { useMemo } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { getNetworkAdjustedStakingBalance } from '@suite-common/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import {
    calculateRewards,
    getStakingDataForNetwork,
    getStakingLimitsByNetworkSymbol,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { useStakingYield } from 'src/hooks/earn/useStakingYield';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

export interface EmptyStakingCardData {
    apy: number | null;
    account: Account | undefined;
    potentialRewards: string;
    hasPotentialRewards: boolean;
    hasEnoughBalanceForStaking: boolean;
    displaySymbol: string;
    isStartStakingDisabled: boolean;
}

interface UseEmptyStakingCardDataProps {
    account: Account | undefined;
}

export const useEmptyStakingCardData = ({
    account,
}: UseEmptyStakingCardDataProps): EmptyStakingCardData => {
    const { CryptoAmountFormatter } = useFormatters();
    const { apy } = useStakingYield({ symbol: account?.symbol, accountKey: account?.key });
    const { isStakingDisabled } = useMessageSystemStaking(account?.symbol);
    const isStartStakingDisabled = isStakingDisabled || !account;

    const stakingData = getStakingDataForNetwork(account);

    const accountBalance = account?.formattedBalance ?? '0';
    const stakingBalance = stakingData?.depositedBalance ?? '0';
    const stakingLimits = getStakingLimitsByNetworkSymbol(account?.symbol);

    const hasEnoughBalanceForStaking = Boolean(
        stakingLimits && new BigNumber(accountBalance).gte(stakingLimits.MIN_AMOUNT_FOR_STAKING),
    );

    const potentialRewards = useMemo(() => {
        const totalBalance = new BigNumber(stakingBalance).plus(accountBalance).toString();
        const amount = calculateRewards(
            getNetworkAdjustedStakingBalance(totalBalance, account),
            apy,
        );

        return CryptoAmountFormatter.format(amount.toString(), {
            symbol: account?.symbol,
            isBalance: true,
            withSymbol: false,
            isEllipsisAppended: false,
            maxDisplayedDecimals: 8,
        });
    }, [accountBalance, stakingBalance, apy, account, CryptoAmountFormatter]);

    const hasPotentialRewards = new BigNumber(potentialRewards).gt(0);

    const displaySymbol = account?.symbol ? getNetworkDisplaySymbol(account.symbol) : '';

    return {
        apy,
        account,
        potentialRewards,
        hasPotentialRewards,
        hasEnoughBalanceForStaking,
        displaySymbol,
        isStartStakingDisabled,
    };
};
