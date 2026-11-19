import { memo } from 'react';

import { gotoThunk } from '@suite/router';
import {
    selectWalletAssetContractAddress,
    selectWalletAssetNetworkSymbol,
    selectWalletAssetTokenDecimals,
    selectWalletAssetTokenSymbol,
} from '@suite-common/assets';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Column, Table } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { PriceTicker, TrendTicker } from '#src/components/suite';
import { useAccountScopedSelector } from '#src/hooks/wallet/useAccountScopedSelector';

import { HomeAssetApyBadge } from './HomeAssetApyBadge';
import { HomeAssetBalance } from './HomeAssetBalance';
import { HomeAssetIdentity } from './HomeAssetIdentity';
import { HOME_ASSET_CELL_PADDING, HOME_ASSET_LINE_GAP } from './homeAssetTableLayout';

type AssetTableRowProps = {
    assetKey: WalletAssetKey;
    /** The row of one account's table, with what that account holds; the wallet's when left out. */
    accountKey?: AccountKey;
    testIdPrefix: string;
    hasBorderTop?: boolean;
    assetNameTestId?: string;
    onOpen?: (networkSymbol: NetworkSymbol) => void;
};

export const AssetTableRow = memo(function AssetTableRow({
    assetKey,
    accountKey,
    testIdPrefix,
    hasBorderTop,
    assetNameTestId,
    onOpen,
}: AssetTableRowProps) {
    const { dispatch } = useServices(injectDispatch);
    const networkSymbol = useAccountScopedSelector(accountKey, state =>
        selectWalletAssetNetworkSymbol(state, assetKey),
    );
    const contractAddress = useAccountScopedSelector(accountKey, state =>
        selectWalletAssetContractAddress(state, assetKey),
    );
    const tokenSymbol = useAccountScopedSelector(accountKey, state =>
        selectWalletAssetTokenSymbol(state, assetKey),
    );
    const tokenDecimals = useAccountScopedSelector(accountKey, state =>
        selectWalletAssetTokenDecimals(state, assetKey),
    );

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
            data-testid={`${testIdPrefix}/${networkSymbol}/${contractAddress ?? 'coin'}`}
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
                <HomeAssetBalance assetKey={assetKey} accountKey={accountKey} />
            </Table.Cell>
        </Table.Row>
    );
});
