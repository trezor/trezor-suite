import { memo } from 'react';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { gotoThunk } from '@suite/router';
import {
    selectWalletAssetContractAddress,
    selectWalletAssetSymbol,
    selectWalletAssetTokenDecimals,
    selectWalletAssetTokenSymbol,
} from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Column, Table } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { PriceTicker, TrendTicker } from '#src/components/suite';
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
    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const tokenSymbol = useSelector(state => selectWalletAssetTokenSymbol(state, assetKey));
    const tokenDecimals = useSelector(state => selectWalletAssetTokenDecimals(state, assetKey));

    if (symbol === undefined) {
        return null;
    }

    const openAssetDetail = () => {
        analytics.report({
            type: events.navigateFlowEvent.name,
            payload: {
                action: 'navigate',
                type: 'asset',
                from: 'home-asset-table',
                networkSymbol: symbol,
            },
        });
        dispatch(gotoThunk({ routeName: 'suite-asset', params: { symbol, contractAddress } }));
    };

    return (
        <Table.Row
            hasBorderTop={hasBorderTop}
            onClick={openAssetDetail}
            data-testid={`@dashboard/home-asset-item/${symbol}/${contractAddress ?? 'coin'}`}
        >
            <Table.Cell padding={HOME_ASSET_CELL_PADDING.first} data-testid={assetNameTestId}>
                <HomeAssetIdentity
                    symbol={symbol}
                    contractAddress={contractAddress}
                    badge={
                        <HomeAssetApyBadge
                            symbol={symbol}
                            contractAddress={contractAddress}
                            tokenSymbol={tokenSymbol}
                            tokenDecimals={tokenDecimals}
                        />
                    }
                />
            </Table.Cell>

            <Table.Cell align="end">
                <Column alignItems="flex-end" gap={HOME_ASSET_LINE_GAP}>
                    <PriceTicker symbol={symbol} contractAddress={contractAddress} />
                    <TrendTicker symbol={symbol} contractAddress={contractAddress} />
                </Column>
            </Table.Cell>

            <Table.Cell align="end" padding={HOME_ASSET_CELL_PADDING.last}>
                <HomeAssetBalance assetKey={assetKey} />
            </Table.Cell>
        </Table.Row>
    );
});
