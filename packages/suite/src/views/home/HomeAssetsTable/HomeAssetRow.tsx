import { memo, useCallback } from 'react';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { useServices } from '@trezor/dependency-injection';

import { AssetTableRow } from './AssetTableRow';

type HomeAssetRowProps = {
    assetKey: WalletAssetKey;
    hasBorderTop?: boolean;
    assetNameTestId?: string;
};

export const HomeAssetRow = memo(function HomeAssetRow(props: HomeAssetRowProps) {
    const { analytics } = useServices(injectDesktopAnalytics);

    const reportOpen = useCallback(
        (networkSymbol: NetworkSymbol) =>
            analytics.report({
                type: events.navigateFlowEvent.name,
                payload: {
                    action: 'navigate',
                    type: 'asset',
                    from: 'home-asset-table',
                    networkSymbol,
                },
            }),
        [analytics],
    );

    return (
        <AssetTableRow {...props} testIdPrefix="@dashboard/home-asset-item" onOpen={reportOpen} />
    );
});
