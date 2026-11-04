import { selectRouteName } from '@suite/router';
import {
    selectHasStakingAccountWarning,
    selectIsStakingAccountActive,
    selectIsStakingAccountDelegatedOutside,
    selectIsStakingAccountWithoutPool,
    selectIsStakingOperationPending,
} from '@suite-common/earn-staking';
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

    const hasPendingOperation = useSelector(state =>
        selectIsStakingOperationPending(state, account.key),
    );

    const hasNoPool = useSelector(state => selectIsStakingAccountWithoutPool(state, account.key));
    const isDelegatedOutside = useSelector(state =>
        selectIsStakingAccountDelegatedOutside(state, account.key),
    );
    const hasOutdatedProvider = useSelector(state =>
        selectHasStakingAccountWarning(state, account.key, 'outdated-provider'),
    );

    const isProviderPromotionEnabled = useSelector(state =>
        selectIsFeatureEnabled(state, Feature.banners.staking.ada.newProvider, true),
    );

    const isStakingActive = useSelector(state => selectIsStakingAccountActive(state, account.key));
    const isCardanoNetworkType = account?.networkType === 'cardano';

    const canPromoteProvider =
        isProviderPromotionEnabled && isDelegatedOutside && (hasOutdatedProvider || isStakingRoute);

    if (
        (!hasNoPool && !canPromoteProvider) ||
        hasPendingOperation ||
        !isCardanoNetworkType ||
        !isStakingActive
    ) {
        return null;
    }

    return <NewProviderCard account={account} />;
}
