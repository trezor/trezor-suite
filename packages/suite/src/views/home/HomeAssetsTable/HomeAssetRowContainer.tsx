import { memo } from 'react';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { gotoThunk } from '@suite/router';
import {
    selectWalletAssetAmount,
    selectWalletAssetContractAddress,
    selectWalletAssetNetworkSymbol,
    selectWalletAssetTokenDecimals,
    selectWalletAssetTokenSymbol,
} from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from '#src/hooks/suite/useSelector';

import { AssetTableRowView } from './AssetTableRowView';

type HomeAssetRowContainerProps = {
    assetKey: WalletAssetKey;
    hasBorderTop?: boolean;
    assetNameTestId?: string;
};

export const HomeAssetRowContainer = memo(function HomeAssetRowContainer({
    assetKey,
    hasBorderTop,
    assetNameTestId,
}: HomeAssetRowContainerProps) {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const networkSymbol = useSelector(state => selectWalletAssetNetworkSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const tokenSymbol = useSelector(state => selectWalletAssetTokenSymbol(state, assetKey));
    const tokenDecimals = useSelector(state => selectWalletAssetTokenDecimals(state, assetKey));
    const amount = useSelector(state => selectWalletAssetAmount(state, assetKey));

    if (networkSymbol === undefined) {
        return null;
    }

    const openAssetDetail = () => {
        analytics.report({
            type: events.navigateFlowEvent.name,
            payload: {
                action: 'navigate',
                type: 'asset',
                from: 'home-asset-table',
                networkSymbol,
            },
        });
        dispatch(
            gotoThunk({
                routeName: 'suite-asset',
                params: { symbol: networkSymbol, contractAddress },
            }),
        );
    };

    return (
        <AssetTableRowView
            networkSymbol={networkSymbol}
            contractAddress={contractAddress}
            tokenSymbol={tokenSymbol}
            tokenDecimals={tokenDecimals}
            amount={amount}
            onOpen={openAssetDetail}
            hasBorderTop={hasBorderTop}
            assetNameTestId={assetNameTestId}
            data-testid={`@dashboard/home-asset-item/${networkSymbol}/${contractAddress ?? 'coin'}`}
        />
    );
});
