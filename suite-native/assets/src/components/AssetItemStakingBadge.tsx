import { memo } from 'react';
import { useSelector } from 'react-redux';

import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { StakingBadge, ZeroApyBadge } from '@suite-native/accounts';
import {
    type NativeStakingRootState,
    selectFirstCardanoAccountStakedWithFiveBinaries,
    selectHasAnyDeviceAccountsWithStaking,
} from '@suite-native/staking';

type AssetItemStakingBadgeProps = {
    symbol: NetworkSymbol;
};

export const AssetItemStakingBadge = memo(({ symbol }: AssetItemStakingBadgeProps) => {
    const hasAnyAccountsWithStaking = useSelector((state: NativeStakingRootState) =>
        selectHasAnyDeviceAccountsWithStaking(state, symbol),
    );
    const stakedWithFiveBinariesAccount = useSelector((state: NativeStakingRootState) =>
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
