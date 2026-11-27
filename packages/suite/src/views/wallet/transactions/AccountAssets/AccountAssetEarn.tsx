import { selectAccountStakingSplit } from '@suite-common/assets';
import { selectIsStakingSupportedSymbol, useNetworkStakingRate } from '@suite-common/earn-staking';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';

import { StakingSplitCard } from '#src/components/wallet/assets/StakingSplitCard';
import { useOpenAccountStaking } from '#src/components/wallet/assets/useOpenAccountStaking';
import { useSelector } from '#src/hooks/suite/useSelector';

type AccountAssetEarnProps = {
    accountKey: AccountKey;
};

/** The account's coin split as the asset detail splits the wallet's; View all opens Staking. */
export const AccountAssetEarn = ({ accountKey }: AccountAssetEarnProps) => {
    const openAccountStaking = useOpenAccountStaking({ from: 'account-overview' });
    const networkSymbol = useSelector(state => selectAccountByKey(state, accountKey)?.symbol);
    const { totalAmount, availableAmount, stakingAmount, stakingRatio } = useSelector(state =>
        selectAccountStakingSplit(state, accountKey),
    );
    const isStakingSupported = useSelector(
        state =>
            networkSymbol !== undefined && selectIsStakingSupportedSymbol(state, networkSymbol),
    );
    const stakingRate = useNetworkStakingRate({ networkSymbol: networkSymbol ?? null, accountKey });

    if (networkSymbol === undefined || !isStakingSupported || !isPositiveBalance(totalAmount)) {
        return null;
    }

    return (
        <StakingSplitCard
            networkSymbol={networkSymbol}
            availableAmount={availableAmount}
            stakingAmount={stakingAmount}
            stakingRatio={stakingRatio}
            stakingRate={stakingRate}
            onViewAll={() => openAccountStaking(networkSymbol)}
            data-testid="@wallet/account-assets/earn"
        />
    );
};
