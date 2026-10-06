import { memo } from 'react';
import { useSelector } from 'react-redux';

import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import {
    type StakeRootState,
    selectFirstCardanoAccountStakedWithFiveBinaries,
    selectHasAnyDeviceAccountsWithStaking,
} from '@suite-common/wallet-core';
import { StakingBadge, ZeroApyBadge } from '@suite-native/accounts';

type AssetItemStakingBadgeProps = {
    symbol: NetworkSymbol;
};

export const AssetItemStakingBadge = memo(({ symbol }: AssetItemStakingBadgeProps) => {
    const hasAnyAccountsWithStaking = useSelector((state: StakeRootState) =>
        selectHasAnyDeviceAccountsWithStaking(state, symbol),
    );
    const stakedWithFiveBinariesAccount = useSelector((state: StakeRootState) =>
        selectFirstCardanoAccountStakedWithFiveBinaries(state),
    );

    if (!hasAnyAccountsWithStaking) {
        return null;
    }

    if (getNetworkType(symbol) === 'cardano' && stakedWithFiveBinariesAccount) {
        return <ZeroApyBadge />;
    }

    return <StakingBadge networkSymbol={symbol} />;
});

AssetItemStakingBadge.displayName = 'AssetItemStakingBadge';
