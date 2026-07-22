import { memo } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';

type AssetItemTitleProps = {
    symbol: NetworkSymbol;
};

export const AssetItemTitle = memo(({ symbol }: AssetItemTitleProps) => {
    const { NetworkNameFormatter } = useFormatters();

    return <NetworkNameFormatter value={symbol} />;
});

AssetItemTitle.displayName = 'AssetItemTitle';
