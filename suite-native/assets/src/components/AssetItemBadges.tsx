import { memo } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Box } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';

import { AccountsCount } from './AccountsCount';
import { AssetItemStakingBadge } from './AssetItemStakingBadge';
import { AssetItemTokensBadge } from './AssetItemTokensBadge';

type AssetItemBadgesProps = {
    symbol: NetworkSymbol;
};

export const AssetItemBadges = memo(({ symbol }: AssetItemBadgesProps) => (
    <>
        <Box>
            <Icon size="medium" color="contentSecondary" name="wallet" />
        </Box>
        <AccountsCount symbol={symbol} />
        <AssetItemStakingBadge symbol={symbol} />
        <AssetItemTokensBadge symbol={symbol} />
    </>
));

AssetItemBadges.displayName = 'AssetItemBadges';
