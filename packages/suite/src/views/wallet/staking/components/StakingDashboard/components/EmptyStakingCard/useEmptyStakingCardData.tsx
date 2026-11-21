import {
    formatStakingAmount,
    getPotentialStakingRewards,
    selectStakeableStakingProductDescriptorBySymbol,
    useNetworkStakingRate,
    useStakingAccess,
} from '@suite-common/earn-staking';
import { useFormatters } from '@suite-common/formatters';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { useStakingOperationSwitch } from '#src/hooks/earn/useStakingOperationSwitch';
import { useSelector } from '#src/hooks/suite/useSelector';

export interface EmptyStakingCardData {
    rate: number | null;
    account: Account;
    potentialRewards: string;
    hasPotentialRewards: boolean;
    hasEnoughBalanceForStaking: boolean;
    displaySymbol: string;
    isStartStakingDisabled: boolean;
    /** Withheld below the minimum firmware: the control stays enabled and asks for the update. */
    isStartStakingFirmwareOutdated: boolean;
    stakingMessageContent: string | null;
}

interface UseEmptyStakingCardDataProps {
    account: Account;
}

export const useEmptyStakingCardData = ({
    account,
}: UseEmptyStakingCardDataProps): EmptyStakingCardData => {
    const { CryptoAmountFormatter } = useFormatters();

    const { rate } = useNetworkStakingRate({
        networkSymbol: account.symbol,
        accountKey: account.key,
    });

    const stakeableDescriptor = useSelector(state =>
        selectStakeableStakingProductDescriptorBySymbol(state, account.symbol),
    );

    const { isDisabled: isStartStakingDisabled, message: stakingMessageContent } =
        useStakingOperationSwitch(stakeableDescriptor?.id ?? null, 'stake');
    const { disabled } = useStakingAccess(stakeableDescriptor?.id ?? null);
    const isStartStakingFirmwareOutdated = disabled.stake?.kind === 'firmware';

    const hasEnoughBalanceForStaking =
        stakeableDescriptor !== null &&
        new BigNumber(account.availableBalance).gte(stakeableDescriptor.limits.minStakeAmount);

    const potentialRewards = CryptoAmountFormatter.format(
        formatStakingAmount({
            amount: getPotentialStakingRewards({
                accounts: [{ availableBalance: account.availableBalance }],
                limits: stakeableDescriptor?.limits ?? null,
                rate,
            }),
            networkSymbol: account.symbol,
        }),
        {
            symbol: account.symbol,
            isBalance: true,
            withSymbol: false,
            isEllipsisAppended: false,
            maxDisplayedDecimals: 8,
        },
    );

    const hasPotentialRewards = new BigNumber(potentialRewards).gt(0);

    const displaySymbol = getNetworkDisplaySymbol(account.symbol);

    return {
        rate,
        account,
        potentialRewards,
        hasPotentialRewards,
        hasEnoughBalanceForStaking,
        displaySymbol,
        isStartStakingDisabled,
        isStartStakingFirmwareOutdated,
        stakingMessageContent,
    };
};
