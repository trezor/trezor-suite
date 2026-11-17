import { memo } from 'react';
import { useSelector } from 'react-redux';

import {
    type StakingDeviceRootState,
    selectDeviceStakingPositionEntriesBySymbol,
} from '@suite-common/earn-staking';
import { hasStakingPositionWarning } from '@suite-common/earn-staking-common';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { StakingBadge, ZeroApyBadge } from '@suite-native/accounts';

type AssetItemStakingBadgeProps = {
    symbol: NetworkSymbol;
};

export const AssetItemStakingBadge = memo(({ symbol }: AssetItemStakingBadgeProps) => {
    const positionEntries = useSelector((state: StakingDeviceRootState) =>
        selectDeviceStakingPositionEntriesBySymbol(state, symbol),
    );

    if (positionEntries.length === 0) {
        return null;
    }

    const hasOutdatedProvider = positionEntries.some(({ position }) =>
        hasStakingPositionWarning(position, 'outdated-provider'),
    );

    if (hasOutdatedProvider) {
        return <ZeroApyBadge />;
    }

    return <StakingBadge networkSymbol={symbol} />;
});

AssetItemStakingBadge.displayName = 'AssetItemStakingBadge';
