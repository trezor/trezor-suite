import { memo, useCallback } from 'react';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { homeAssetTableSelectors } from '@suite-common/assets';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { useServices } from '@trezor/dependency-injection';

import { AssetTableRow } from './AssetTableRow';

type HomeAssetRowProps = {
    assetKey: WalletAssetKey;
    hasBorderTop?: boolean;
    assetNameTestId?: string;
};

const getTestId = (networkSymbol: NetworkSymbol, contractAddress: TokenAddress | undefined) =>
    `@dashboard/home-asset-item/${networkSymbol}/${contractAddress ?? 'coin'}`;

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
        <AssetTableRow
            {...props}
            selectors={homeAssetTableSelectors}
            getTestId={getTestId}
            onOpen={reportOpen}
        />
    );
});
