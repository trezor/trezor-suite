import React from 'react';

import type { GlobalReceiveAssetListItem } from '@suite-common/receive';
import { toTokenSymbol } from '@suite-common/wallet-types';
import { AccountsListItemBase } from '@suite-native/accounts';
import { Badge, Box, HStack, Text } from '@suite-native/atoms';
import {
    BaseCurrencyAmountFormatter,
    CompactTokenAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export type PositionedAssetListItem = GlobalReceiveAssetListItem & {
    isFirst: boolean;
    isLast: boolean;
};

type AssetListItemProps = {
    item: PositionedAssetListItem;
    onSelect: (item: PositionedAssetListItem) => void;
};

const rowStyle = prepareNativeStyle<{
    isFirst: boolean;
    isLast: boolean;
}>((utils, { isFirst, isLast }) => ({
    backgroundColor: utils.colors.surfaceFillRaised,
    extend: [
        {
            condition: isFirst,
            style: {
                borderTopLeftRadius: utils.borders.radii.r16,
                borderTopRightRadius: utils.borders.radii.r16,
            },
        },
        {
            condition: isLast,
            style: {
                marginBottom: utils.spacings.sp16,
                borderBottomLeftRadius: utils.borders.radii.r16,
                borderBottomRightRadius: utils.borders.radii.r16,
            },
        },
    ],
}));

export const AssetListItem = ({ item, onSelect }: AssetListItemProps) => {
    const { asset, balance, isFirst, isLast } = item;

    const { applyStyle } = useNativeStyles();

    const title = asset.displaySymbolName ?? asset.name;

    return (
        <Box style={applyStyle(rowStyle, { isFirst, isLast })}>
            <AccountsListItemBase
                onPress={() => onSelect(item)}
                icon={
                    <TokenIcon
                        networkSymbol={asset.networkSymbol}
                        contractAddress={asset.contractAddress ?? undefined}
                        tokenSymbol={asset.coingeckoId}
                        showNetworkIcon
                        size="medium"
                    />
                }
                title={title}
                badges={
                    <HStack alignItems="center">
                        <Text variant="body-sm" priority="secondary">
                            {asset.displaySymbol}
                        </Text>
                        {title != asset.networkName && <Badge label={asset.networkName} />}
                    </HStack>
                }
                mainValue={
                    balance && (
                        <BaseCurrencyAmountFormatter
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            value={balance.fiatAmount}
                        />
                    )
                }
                secondaryValue={
                    balance && (
                        <CompactTokenAmountFormatter
                            value={asDecimalTokenAmount(balance.cryptoAmount)}
                            tokenSymbol={toTokenSymbol(asset.symbol)}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        />
                    )
                }
                isFirst={isFirst}
                isLast={isLast}
            />
        </Box>
    );
};
