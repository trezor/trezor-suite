import { Feature, selectIsFeatureEnabled } from '@suite-common/message-system';
import { hasPendingStakeTypeTransaction } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { isCardanoStakedWithEverstake } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';

import { NewProviderCard } from '../../staking/components/StakingDashboard/components/NewProviderCard';

interface CardanoNewProviderCardProps {
    account: Account;
}

export function CardanoNewProviderCard({ account }: CardanoNewProviderCardProps) {
    const hasPendingTx = useSelector(state => hasPendingStakeTypeTransaction(state, account.key));
    const isStakedWithEverstake = isCardanoStakedWithEverstake(account);
    const isNewProviderBannerEnabled = useSelector(state =>
        selectIsFeatureEnabled(state, Feature.banners.staking.ada.newProvider, true),
    );

    if (isStakedWithEverstake || hasPendingTx || !isNewProviderBannerEnabled) {
        return null;
    }

    return <NewProviderCard />;
}
