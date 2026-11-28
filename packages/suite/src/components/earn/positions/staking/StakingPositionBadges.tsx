import { useSelector } from 'react-redux';

import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import {
    type StakingRootState,
    formatStakingAmount,
    selectHasStakingAccountWarning,
    selectIsStakingAccountDelegatedOutside,
    selectStakingAccountPositionDetails,
} from '@suite-common/earn-staking';
import {
    type StakingPositionBalances,
    type StakingRateKind,
    getStakingEarningAmount,
} from '@suite-common/earn-staking-common';
import { type NetworkSymbol } from '@suite-common/networks';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { Badge } from '@trezor/components';
import { InfoIcon, WarningIcon } from '@trezor/icons';
import { BigNumber } from '@trezor/utils';

import { EarnRateBadge } from '#src/components/earn/positions/EarnRateBadge';
import { useFormatApy } from '#src/hooks/earn/useFormatApy';

type StakingPositionBadgesProps = {
    accountKey?: AccountKey;
    balances: StakingPositionBalances;
    rate?: number | null;
    rateKind?: StakingRateKind;
};

export const StakingPositionBadges = ({
    accountKey,
    balances,
    rate,
    rateKind,
}: StakingPositionBadgesProps) => {
    const formatApyValue = useFormatApy();

    const hasOutdatedProvider = useSelector(
        (state: StakingRootState) =>
            accountKey !== undefined &&
            selectHasStakingAccountWarning(state, accountKey, 'outdated-provider'),
    );

    const isDelegatedOutside = useSelector(
        (state: StakingRootState) =>
            accountKey !== undefined && selectIsStakingAccountDelegatedOutside(state, accountKey),
    );

    const tronStaking = useSelector((state: StakingRootState) =>
        accountKey === undefined
            ? null
            : selectStakingAccountPositionDetails(state, accountKey, 'tron-staking'),
    );

    const hasUnallocatedVotes =
        tronStaking !== null && isPositiveBalance(tronStaking.unallocatedVotingPower);

    const rateBadge =
        rate !== undefined && rateKind !== undefined ? (
            <EarnRateBadge rateKind={rateKind} rate={rate} />
        ) : null;

    const isEarning = isPositiveBalance(getStakingEarningAmount(balances));

    if (!isEarning && isPositiveBalance(balances.withdrawable)) {
        return (
            <Badge size="small" intent="brand">
                <Translation id="TR_EARN_READY_TO_WITHDRAW" />
            </Badge>
        );
    }

    if (!isEarning && isPositiveBalance(balances.unstaking)) {
        return (
            <Badge size="small" intent="info">
                <Translation id="TR_STAKE_UNSTAKING" />
            </Badge>
        );
    }

    if (hasOutdatedProvider) {
        return (
            <Badge size="small" intent="warning" iconLeft={WarningIcon}>
                <Translation id="TR_STAKING_REWARDS_REDUCED" />
            </Badge>
        );
    }

    if (isDelegatedOutside) {
        return (
            <Badge size="small" intent="info" iconLeft={InfoIcon}>
                <Translation id="TR_STAKING_EXTERNAL_POOL" />
            </Badge>
        );
    }

    if (hasUnallocatedVotes) {
        const hasAssignedVotes = new BigNumber(tronStaking.votingPower).gt(
            tronStaking.unallocatedVotingPower,
        );

        if (!hasAssignedVotes) {
            return (
                <Badge size="small" intent="warning" iconLeft={WarningIcon}>
                    <Translation id="TR_EARN_TRON_NO_VOTES_BADGE" />
                </Badge>
            );
        }

        const count = formatStakingAmount({
            amount: tronStaking.unallocatedVotingPower,
            networkSymbol: 'trx' as NetworkSymbol,
        });

        return (
            <>
                {typeof rate === 'number' ? (
                    <Badge size="small" intent="brand">
                        <Translation
                            id="TR_EARN_TRON_APR_ON_ASSIGNED_VOTES_BADGE"
                            values={{ apr: formatApyValue(rate) }}
                        />
                    </Badge>
                ) : (
                    rateBadge
                )}

                <Badge size="small" intent="info" iconLeft={InfoIcon}>
                    <HiddenPlaceholder>
                        <Translation id="TR_EARN_TRON_VOTES_LEFT_BADGE" values={{ count }} />
                    </HiddenPlaceholder>
                </Badge>
            </>
        );
    }

    return rateBadge;
};
