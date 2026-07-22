import { memo } from 'react';
import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Badge } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { type TokensRootState, selectHasDeviceAnyTokensForNetwork } from '@suite-native/tokens';

type AssetItemTokensBadgeProps = {
    symbol: NetworkSymbol;
};

export const AssetItemTokensBadge = memo(({ symbol }: AssetItemTokensBadgeProps) => {
    const hasAnyTokens = useSelector((state: TokensRootState) =>
        selectHasDeviceAnyTokensForNetwork(state, symbol),
    );

    if (!hasAnyTokens) {
        return null;
    }

    return <Badge size="small" label={<Translation id="generic.tokens" />} />;
});

AssetItemTokensBadge.displayName = 'AssetItemTokensBadge';
