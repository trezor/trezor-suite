import { Feature, selectIsFeatureEnabled } from '@suite-common/message-system';
import {
    hasPendingStakeTypeTransaction,
    selectAccountIsStakingActive,
    selectCardanoPoolsInfo,
} from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { isCardanoStakedWithEverstake } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';

import { NewProviderCard } from '../../staking/components/StakingDashboard/components/NewProviderCard';

interface CardanoNewProviderCardProps {
    account: Account;
}

export function CardanoNewProviderCard({ account }: CardanoNewProviderCardProps) {
    const hasPendingTx = useSelector(state => hasPendingStakeTypeTransaction(state, account.key));
    const cardanoStakingPools = useSelector(selectCardanoPoolsInfo);
    const isStakedWithEverstake = isCardanoStakedWithEverstake(account, cardanoStakingPools);
    const isNewProviderBannerEnabled = useSelector(state =>
        selectIsFeatureEnabled(state, Feature.banners.staking.ada.newProvider, true),
    );
    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, account.key));
    const isCardanoNetworkType = account?.networkType === 'cardano';

    if (
        isStakedWithEverstake ||
        hasPendingTx ||
        !isNewProviderBannerEnabled ||
        !isCardanoNetworkType ||
        !isStakingActive
    ) {
        return null;
    }

    return <NewProviderCard account={account} />;
}
