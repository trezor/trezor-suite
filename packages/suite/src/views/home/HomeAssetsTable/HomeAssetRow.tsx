import { memo } from 'react';

import {
    selectWalletAssetContractAddress,
    selectWalletAssetDisplaySymbol,
    selectWalletAssetSymbol,
} from '@suite-common/assets';
import { useFormatters } from '@suite-common/formatters';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Column, Row, Table, Text } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

import { PriceTicker, TrendTicker } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

import { HomeAssetBalance } from './HomeAssetBalance';
import { HOME_ASSET_CELL_PADDING } from './homeAssetTableLayout';

type HomeAssetRowProps = {
    assetKey: WalletAssetKey;
    hasBorderTop?: boolean;
    isHidden?: boolean;
    /** Takes the key so the caller can hand over a stable callback, which `memo` needs to hold. */
    onSelect?: (assetKey: WalletAssetKey) => void;
    /** The asset the row stands for is appended to it, so every row has an id of its own. */
    testIdPrefix?: string;
};

export const HomeAssetRow = memo(function HomeAssetRow({
    assetKey,
    hasBorderTop,
    isHidden,
    onSelect,
    testIdPrefix = '@dashboard/home-asset-item',
}: HomeAssetRowProps) {
    const { NetworkNameFormatter } = useFormatters();
    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey, isHidden));
    const contractAddress = useSelector(state =>
        selectWalletAssetContractAddress(state, assetKey, isHidden),
    );
    const displaySymbol = useSelector(state =>
        selectWalletAssetDisplaySymbol(state, assetKey, isHidden),
    );

    if (symbol === undefined) {
        return null;
    }

    return (
        <Table.Row
            hasBorderTop={hasBorderTop}
            onClick={onSelect && (() => onSelect(assetKey))}
            data-testid={`${testIdPrefix}/${symbol}/${contractAddress ?? 'coin'}`}
        >
            <Table.Cell padding={HOME_ASSET_CELL_PADDING.first}>
                <Row gap={12}>
                    <TokenIcon
                        symbol={symbol}
                        contractAddress={contractAddress}
                        size={32}
                        showNetworkIcon
                        placeholder={displaySymbol ?? ''}
                    />
                    <Column alignItems="flex-start" gap={2}>
                        <Text typographyStyle="body-md" data-testid="@dashboard/home-asset/name">
                            {displaySymbol}
                        </Text>
                        <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                            <NetworkNameFormatter value={symbol} />
                        </Text>
                    </Column>
                </Row>
            </Table.Cell>

            <Table.Cell align="end">
                <Column alignItems="flex-end" gap={2}>
                    <PriceTicker symbol={symbol} contractAddress={contractAddress} />
                    <TrendTicker symbol={symbol} contractAddress={contractAddress} />
                </Column>
            </Table.Cell>

            <Table.Cell align="end" padding={HOME_ASSET_CELL_PADDING.last}>
                <HomeAssetBalance assetKey={assetKey} isHidden={isHidden} />
            </Table.Cell>
        </Table.Row>
    );
});
