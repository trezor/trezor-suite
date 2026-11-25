import { memo } from 'react';

import { ASSET_TABLE_LINE_GAP } from '@suite/assets';
import { gotoThunk } from '@suite/router';
import {
    selectHiddenAssetAmount,
    selectWalletAssetContractAddress,
    selectWalletAssetNetworkSymbol,
} from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box, Column, type Padding, Row } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { typographyStylesBase } from '@trezor/theme';

import { PriceTicker } from '#src/components/suite/Ticker/PriceTicker';
import { TrendTicker } from '#src/components/suite/Ticker/TrendTicker';
import { AssetIdentity } from '#src/components/wallet/assets/AssetIdentity';
import { AssetTableAmount } from '#src/components/wallet/assets/AssetTableAmount';
import { useSelector } from '#src/hooks/suite/useSelector';
import { useIsAssetFirstHome } from '#src/views/home/useIsAssetFirstHome';

export const HIDDEN_TOKEN_ROW_PADDING = { vertical: 12, horizontal: 20 } satisfies Padding;

/** A row is two lines, the first in body-md and the second in body-sm. */
export const HIDDEN_TOKEN_ROW_HEIGHT =
    HIDDEN_TOKEN_ROW_PADDING.vertical * 2 +
    typographyStylesBase['body-md'].lineHeight +
    ASSET_TABLE_LINE_GAP +
    typographyStylesBase['body-sm'].lineHeight;

export const HIDDEN_TOKEN_PRICE_WIDTH = 140;

export const HIDDEN_TOKEN_BALANCE_WIDTH = 180;

type HiddenTokenRowProps = {
    assetKey: WalletAssetKey;
    accountKey?: AccountKey;
    onSelect: (assetKey: WalletAssetKey) => void;
};

export const HiddenTokenRow = memo(function HiddenTokenRow({
    assetKey,
    accountKey,
    onSelect,
}: HiddenTokenRowProps) {
    const { dispatch } = useServices(injectDispatch);
    const isAssetDetailEnabled = useIsAssetFirstHome();
    const networkSymbol = useSelector(state =>
        selectWalletAssetNetworkSymbol(state, assetKey, true),
    );
    const contractAddress = useSelector(state =>
        selectWalletAssetContractAddress(state, assetKey, true),
    );
    const amount = useSelector(state => selectHiddenAssetAmount(state, assetKey, accountKey));

    if (networkSymbol === undefined) {
        return null;
    }

    const handleClick = () => {
        if (!isAssetDetailEnabled) {
            onSelect(assetKey);

            return;
        }

        dispatch(
            gotoThunk({
                routeName: 'suite-asset',
                params: { symbol: networkSymbol, contractAddress },
            }),
        );
    };

    return (
        <Box
            onClick={handleClick}
            cursor="pointer"
            backgroundColorOnInteraction="elementFillGhostHovered"
            data-testid={`@hidden-tokens/item/${networkSymbol}/${contractAddress ?? 'coin'}`}
        >
            <Row gap={16} padding={HIDDEN_TOKEN_ROW_PADDING}>
                <Row flex="1" minWidth={0}>
                    <AssetIdentity symbol={networkSymbol} contractAddress={contractAddress} />
                </Row>
                <Column
                    width={HIDDEN_TOKEN_PRICE_WIDTH}
                    alignItems="flex-end"
                    gap={ASSET_TABLE_LINE_GAP}
                >
                    <PriceTicker symbol={networkSymbol} contractAddress={contractAddress} />
                    <TrendTicker symbol={networkSymbol} contractAddress={contractAddress} />
                </Column>
                <Column width={HIDDEN_TOKEN_BALANCE_WIDTH} alignItems="flex-end">
                    {amount !== undefined && (
                        <AssetTableAmount
                            symbol={networkSymbol}
                            contractAddress={contractAddress}
                            amount={amount}
                        />
                    )}
                </Column>
            </Row>
        </Box>
    );
});
