import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import {
    type StakingRootState,
    formatStakingAmount,
    selectStakingAccountPositionDetails,
} from '@suite-common/earn-staking';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { Badge } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type TronUnassignedVotesBadgeProps = {
    accountKey: AccountKey;
    fallback?: ReactNode;
    showStakingIcon?: boolean;
};

export const TronUnassignedVotesBadge = ({
    accountKey,
    fallback,
    showStakingIcon,
}: TronUnassignedVotesBadgeProps) => {
    const unallocatedVotingPower = useSelector(
        (state: StakingRootState) =>
            selectStakingAccountPositionDetails(state, accountKey, 'tron-staking')
                ?.unallocatedVotingPower,
    );

    if (!unallocatedVotingPower || !isPositiveBalance(unallocatedVotingPower))
        return fallback ?? null;

    const count = formatStakingAmount({
        amount: unallocatedVotingPower,
        networkSymbol: asNetworkSymbol('trx'),
    });

    return (
        <Badge
            intent="info"
            icon={showStakingIcon ? 'piggyBank' : 'info'}
            size="small"
            label={<Translation id="earn.tron.votesLeftBadge" values={{ count }} />}
        />
    );
};
