import { selectRouteName } from '@suite/router';
import { Feature, selectIsFeatureEnabled } from '@suite-common/message-system';
import {
    isCardanoStakedOutsideEverstake,
    isCardanoStakedWithFiveBinaries,
} from '@suite-common/staking';
import {
    hasPendingStakeTypeTransaction,
    selectAccountIsStakingActive,
    selectCardanoPoolsInfo,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';

import { NewProviderCard } from '../StakingDashboard/components/NewProviderCard';

interface CardanoNewProviderCardProps {
    account: Account;
}

export function CardanoNewProviderCard({ account }: CardanoNewProviderCardProps) {
    const routeName = useSelector(selectRouteName);

    const hasPendingTx = useSelector(state => hasPendingStakeTypeTransaction(state, account.key));
    const cardanoStakingPools = useSelector(selectCardanoPoolsInfo);
    const isStakedOutsideEverstake = isCardanoStakedOutsideEverstake(account, cardanoStakingPools);
    const isStakedWithFiveBinaries = isCardanoStakedWithFiveBinaries(account);
    const isStakingRoute = routeName?.includes('staking');

    const isNewProviderBannerEnabled = useSelector(state =>
        selectIsFeatureEnabled(state, Feature.banners.staking.ada.newProvider, true),
    );
    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, account.key));
    const isCardanoNetworkType = account?.networkType === 'cardano';

    if (
        !isStakedOutsideEverstake ||
        hasPendingTx ||
        !isNewProviderBannerEnabled ||
        !isCardanoNetworkType ||
        !isStakingActive ||
        (!isStakedWithFiveBinaries && !isStakingRoute)
    ) {
        return null;
    }

    return <NewProviderCard account={account} />;
}
