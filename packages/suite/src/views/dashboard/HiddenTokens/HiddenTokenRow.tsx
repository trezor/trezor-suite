import { memo } from 'react';

import {
    selectWalletAssetContractAddress,
    selectWalletAssetDisplaySymbol,
    selectWalletAssetSymbol,
    selectWalletAssetTokenSymbol,
} from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Box, Column, type Padding, Row } from '@trezor/components';
import { typographyStylesBase } from '@trezor/theme';

import { PriceTicker, TrendTicker } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { HomeAssetBalance } from 'src/views/home/HomeAssetsTable/HomeAssetBalance';
import { HomeAssetIdentity } from 'src/views/home/HomeAssetsTable/HomeAssetIdentity';
import { HOME_ASSET_LINE_GAP } from 'src/views/home/HomeAssetsTable/homeAssetTableLayout';

export const HIDDEN_TOKEN_ROW_PADDING = { vertical: 12, horizontal: 20 } satisfies Padding;

/** A row is two lines, the first in body-md and the second in body-sm. */
export const HIDDEN_TOKEN_ROW_HEIGHT =
    HIDDEN_TOKEN_ROW_PADDING.vertical * 2 +
    typographyStylesBase['body-md'].lineHeight +
    HOME_ASSET_LINE_GAP +
    typographyStylesBase['body-sm'].lineHeight;

export const HIDDEN_TOKEN_PRICE_WIDTH = 140;

export const HIDDEN_TOKEN_BALANCE_WIDTH = 180;

type HiddenTokenRowProps = {
    assetKey: WalletAssetKey;
    onSelect: (assetKey: WalletAssetKey) => void;
};

export const HiddenTokenRow = memo(function HiddenTokenRow({
    assetKey,
    onSelect,
}: HiddenTokenRowProps) {
    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey, true));
    const contractAddress = useSelector(state =>
        selectWalletAssetContractAddress(state, assetKey, true),
    );
    const displaySymbol = useSelector(state =>
        selectWalletAssetDisplaySymbol(state, assetKey, true),
    );
    const tokenSymbol = useSelector(state => selectWalletAssetTokenSymbol(state, assetKey, true));

    if (symbol === undefined) {
        return null;
    }

    return (
        <Box
            onClick={() => onSelect(assetKey)}
            cursor="pointer"
            backgroundColorOnInteraction="elementFillGhostHovered"
            data-testid={`@hidden-tokens/item/${symbol}/${contractAddress ?? 'coin'}`}
        >
            <Row gap={16} padding={HIDDEN_TOKEN_ROW_PADDING}>
                <Row flex="1" minWidth={0}>
                    <HomeAssetIdentity
                        symbol={symbol}
                        contractAddress={contractAddress}
                        displaySymbol={displaySymbol}
                        tokenSymbol={tokenSymbol}
                    />
                </Row>
                <Column
                    width={HIDDEN_TOKEN_PRICE_WIDTH}
                    alignItems="flex-end"
                    gap={HOME_ASSET_LINE_GAP}
                >
                    <PriceTicker symbol={symbol} contractAddress={contractAddress} />
                    <TrendTicker symbol={symbol} contractAddress={contractAddress} />
                </Column>
                <Column width={HIDDEN_TOKEN_BALANCE_WIDTH} alignItems="flex-end">
                    <HomeAssetBalance assetKey={assetKey} isHidden />
                </Column>
            </Row>
        </Box>
    );
});
