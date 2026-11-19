import { memo } from 'react';

import { gotoThunk } from '@suite/router';
import { type AssetTableSelectors } from '@suite-common/assets';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
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

type AssetTableRowProps = {
    assetKey: WalletAssetKey;
    selectors: AssetTableSelectors;
    hasBorderTop?: boolean;
    assetNameTestId?: string;
    getTestId: (networkSymbol: NetworkSymbol, contractAddress: TokenAddress | undefined) => string;
    onOpen?: (networkSymbol: NetworkSymbol) => void;
};

export const AssetTableRow = memo(function AssetTableRow({
    assetKey,
    selectors,
    hasBorderTop,
    assetNameTestId,
    getTestId,
    onOpen,
}: AssetTableRowProps) {
    const { dispatch } = useServices(injectDispatch);
    const {
        selectWalletAssetContractAddress,
        selectWalletAssetNetworkSymbol,
        selectWalletAssetTokenDecimals,
        selectWalletAssetTokenSymbol,
    } = selectors;
    const networkSymbol = useSelector(state => selectWalletAssetNetworkSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const tokenSymbol = useSelector(state => selectWalletAssetTokenSymbol(state, assetKey));
    const tokenDecimals = useSelector(state => selectWalletAssetTokenDecimals(state, assetKey));

    if (networkSymbol === undefined) {
        return null;
    }

    const openAssetDetail = () => {
        onOpen?.(networkSymbol);
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
            data-testid={getTestId(networkSymbol, contractAddress)}
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
                <HomeAssetBalance assetKey={assetKey} selectors={selectors} />
            </Table.Cell>
        </Table.Row>
    );
});
