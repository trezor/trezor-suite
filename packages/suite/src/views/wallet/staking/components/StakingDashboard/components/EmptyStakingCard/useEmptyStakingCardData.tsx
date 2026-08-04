import { useMemo } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { useFormatters } from '@suite-common/formatters';
import { getNetworkAdjustedStakingBalance } from '@suite-common/staking';
import { getNetworkDisplaySymbol , selectNetworkConfigDeps } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import {
    calculateRewards,
    getStakingDataForNetwork,
    getStakingLimitsByNetworkSymbol,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { useStakingRate } from 'src/hooks/earn/useStakingRate';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

export interface EmptyStakingCardData {
    rate: number | null;
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
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    const { CryptoAmountFormatter } = useFormatters();
    const { rate } = useStakingRate({ symbol: account?.symbol, accountKey: account?.key });
    const { isStakingDisabled } = useMessageSystemStaking(account?.symbol);
    const isStartStakingDisabled = isStakingDisabled || !account;

    const stakingData = getStakingDataForNetwork(networkConfigDeps, account);

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
            rate,
        );

        return CryptoAmountFormatter.format(amount.toString(), {
            symbol: account?.symbol,
            isBalance: true,
            withSymbol: false,
            isEllipsisAppended: false,
            maxDisplayedDecimals: 8,
        });
    }, [accountBalance, stakingBalance, rate, account, CryptoAmountFormatter]);

    const hasPotentialRewards = new BigNumber(potentialRewards).gt(0);

    const displaySymbol = account?.symbol
        ? getNetworkDisplaySymbol(networkConfigDeps, account.symbol)
        : '';

    return {
        rate,
        account,
        potentialRewards,
        hasPotentialRewards,
        hasEnoughBalanceForStaking,
        displaySymbol,
        isStartStakingDisabled,
    };
};
