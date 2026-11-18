import { selectRouteName } from '@suite/router';
import {
    selectHasStakingAccountWarning,
    selectIsStakingAccountActive,
    selectIsStakingAccountDelegatedOutside,
    selectStakingAccountPositionEntry,
} from '@suite-common/earn-staking';
import { hasPendingStakingOperation } from '@suite-common/earn-staking-common';
import { Feature, selectIsFeatureEnabled } from '@suite-common/message-system';
import { type Account } from '@suite-common/wallet-types';

import { useSelector } from '#src/hooks/suite/useSelector';

import { NewProviderCard } from '../StakingDashboard/components/NewProviderCard';

interface CardanoNewProviderCardProps {
    account: Account;
}

export function CardanoNewProviderCard({ account }: CardanoNewProviderCardProps) {
    const routeName = useSelector(selectRouteName);

    const isStakingRoute = routeName?.includes('staking');

    const hasPendingOperation = useSelector(state => {
        const positionEntry = selectStakingAccountPositionEntry(state, account.key);

        return positionEntry !== null && hasPendingStakingOperation(positionEntry.position);
    });

    const isDelegatedOutside = useSelector(state =>
        selectIsStakingAccountDelegatedOutside(state, account.key),
    );
    const hasOutdatedProvider = useSelector(state =>
        selectHasStakingAccountWarning(state, account.key, 'outdated-provider'),
    );

    const isNewProviderBannerEnabled = useSelector(state =>
        selectIsFeatureEnabled(state, Feature.banners.staking.ada.newProvider, true),
    );

    const isStakingActive = useSelector(state => selectIsStakingAccountActive(state, account.key));
    const isCardanoNetworkType = account?.networkType === 'cardano';

    if (
        !isDelegatedOutside ||
        hasPendingOperation ||
        !isNewProviderBannerEnabled ||
        !isCardanoNetworkType ||
        !isStakingActive ||
        (!hasOutdatedProvider && !isStakingRoute)
    ) {
        return null;
    }

    return <NewProviderCard account={account} />;
}
