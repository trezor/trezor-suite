import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { type StakingRootState, selectStakingAccountNotice } from '@suite-common/earn-staking';
import { type AccountKey } from '@suite-common/wallet-types';
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
    const notice = useSelector((state: StakingRootState) =>
        selectStakingAccountNotice(state, accountKey),
    );

    if (notice?.kind !== 'votes-left') return fallback ?? null;

    return (
        <Badge
            intent="info"
            icon={showStakingIcon ? 'piggyBank' : 'info'}
            size="small"
            label={<Translation id="earn.tron.votesLeftBadge" values={{ count: notice.count }} />}
        />
    );
};
