import { memo } from 'react';

import { AssetItem } from '@suite/assets';
import { gotoThunk } from '@suite/router';
import {
    selectWalletAssetAmount,
    selectWalletAssetContractAddress,
    selectWalletAssetFiatValue,
    selectWalletAssetNetworkSymbol,
} from '@suite-common/assets';
import { ExperimentId, useIsExperimentVariantActive } from '@suite-common/message-system';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Box, type Padding, Row } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { typographyStylesBase } from '@trezor/theme';

import { useSelector } from '#src/hooks/suite/useSelector';

export const HIDDEN_TOKEN_ROW_PADDING = { vertical: 12, horizontal: 20 } satisfies Padding;

/** A row is two lines, the first in body-md and the second in body-sm. */
export const HIDDEN_TOKEN_ROW_HEIGHT =
    HIDDEN_TOKEN_ROW_PADDING.vertical * 2 +
    typographyStylesBase['body-md'].lineHeight +
    typographyStylesBase['body-sm'].lineHeight;

export const HIDDEN_TOKEN_BALANCE_WIDTH = 180;

type HiddenTokenRowProps = {
    assetKey: WalletAssetKey;
    onSelect: (assetKey: WalletAssetKey) => void;
};

export const HiddenTokenRow = memo(function HiddenTokenRow({
    assetKey,
    onSelect,
}: HiddenTokenRowProps) {
    const { dispatch } = useServices(injectDispatch);
    const isAssetDetailEnabled = useIsExperimentVariantActive({
        experimentId: ExperimentId.assetFirstHomeTable,
        variant: 'B',
    });
    const networkSymbol = useSelector(state =>
        selectWalletAssetNetworkSymbol(state, assetKey, true),
    );
    const contractAddress = useSelector(state =>
        selectWalletAssetContractAddress(state, assetKey, true),
    );
    const amount = useSelector(state => selectWalletAssetAmount(state, assetKey, true));
    const fiatAmount = useSelector(state => selectWalletAssetFiatValue(state, assetKey));

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
            <Row gap={16} padding={HIDDEN_TOKEN_ROW_PADDING} justifyContent="space-between">
                <AssetItem.Identity
                    networkSymbol={networkSymbol}
                    contractAddress={contractAddress}
                    showNetworkIcon
                    data-testid="@dashboard/home-asset/name"
                />
                {amount !== undefined && (
                    <AssetItem.Balance
                        networkSymbol={networkSymbol}
                        contractAddress={contractAddress}
                        balance={{ cryptoAmount: amount, fiatAmount: fiatAmount ?? null }}
                        width={HIDDEN_TOKEN_BALANCE_WIDTH}
                    />
                )}
            </Row>
        </Box>
    );
});
