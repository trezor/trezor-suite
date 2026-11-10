import { memo } from 'react';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { gotoThunk } from '@suite/router';
import {
    selectWalletAssetContractAddress,
    selectWalletAssetNetworkSymbol,
    selectWalletAssetTokenDecimals,
    selectWalletAssetTokenSymbol,
} from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Column, Table } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { PriceTicker } from '#src/components/suite/Ticker/PriceTicker';
import { TrendTicker } from '#src/components/suite/Ticker/TrendTicker';
import { useSelector } from '#src/hooks/suite';

import { HomeAssetApyBadge } from './HomeAssetApyBadge';
import { HomeAssetBalance } from './HomeAssetBalance';
import { HomeAssetIdentity } from './HomeAssetIdentity';
import { HOME_ASSET_CELL_PADDING, HOME_ASSET_LINE_GAP } from './homeAssetTableLayout';

type HomeAssetRowProps = {
    assetKey: WalletAssetKey;
    hasBorderTop?: boolean;
    assetNameTestId?: string;
};

export const HomeAssetRow = memo(function HomeAssetRow({
    assetKey,
    hasBorderTop,
    assetNameTestId,
}: HomeAssetRowProps) {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const networkSymbol = useSelector(state => selectWalletAssetNetworkSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const tokenSymbol = useSelector(state => selectWalletAssetTokenSymbol(state, assetKey));
    const tokenDecimals = useSelector(state => selectWalletAssetTokenDecimals(state, assetKey));

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
        <Table.Row
            hasBorderTop={hasBorderTop}
            onClick={openAssetDetail}
            data-testid={`@dashboard/home-asset-item/${networkSymbol}/${contractAddress ?? 'coin'}`}
        >
            <Table.Cell padding={HOME_ASSET_CELL_PADDING.first} data-testid={assetNameTestId}>
                <HomeAssetIdentity
                    symbol={networkSymbol}
                    contractAddress={contractAddress}
                    badge={
                        <HomeAssetApyBadge
                            symbol={networkSymbol}
                            contractAddress={contractAddress}
                            tokenSymbol={tokenSymbol}
                            tokenDecimals={tokenDecimals}
                        />
                    }
                />
            </Table.Cell>

            <Table.Cell align="end">
                <Column alignItems="flex-end" gap={HOME_ASSET_LINE_GAP}>
                    <PriceTicker symbol={networkSymbol} contractAddress={contractAddress} />
                    <TrendTicker symbol={networkSymbol} contractAddress={contractAddress} />
                </Column>
            </Table.Cell>

            <Table.Cell align="end" padding={HOME_ASSET_CELL_PADDING.last}>
                <HomeAssetBalance assetKey={assetKey} />
            </Table.Cell>
        </Table.Row>
    );
});
