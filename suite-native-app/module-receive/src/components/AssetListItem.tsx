import React from 'react';
import { useSelector } from 'react-redux';

import {
    type NetworksRootState,
    selectIsNativeTokenNetworkNameRedundant,
} from '@suite-common/networks';
import type { GlobalReceiveAssetListItem } from '@suite-common/receive';
import { getNetwork } from '@suite-common/wallet-config';
import { AccountsListItemBase } from '@suite-native/accounts';
import { AssetIcon, AssetName, AssetSymbol } from '@suite-native/assets';
import { Badge, Box, HStack, Text } from '@suite-native/atoms';
import {
    BaseCurrencyAmountFormatter,
    CompactCryptoAmountFormatter,
    CompactTokenAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
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
    const { assetId, balance, isFirst, isLast } = item;
    const { networkSymbol, contractAddress } = assetId;

    const { applyStyle } = useNativeStyles();

    const isNetworkNameRedundant = useSelector((state: NetworksRootState) =>
        selectIsNativeTokenNetworkNameRedundant(state, networkSymbol),
    );
    const shouldShowNetworkBadge = !!contractAddress || !isNetworkNameRedundant;
    const tokenContract = contractAddress;

    return (
        <Box style={applyStyle(rowStyle, { isFirst, isLast })}>
            <AccountsListItemBase
                onPress={() => onSelect(item)}
                icon={
                    <AssetIcon
                        networkSymbol={networkSymbol}
                        contractAddress={tokenContract}
                        showNetworkIcon
                        size="medium"
                    />
                }
                title={<AssetName networkSymbol={networkSymbol} contractAddress={tokenContract} />}
                badges={
                    <HStack alignItems="center">
                        <Text variant="body-sm" priority="secondary">
                            <AssetSymbol
                                networkSymbol={networkSymbol}
                                contractAddress={tokenContract}
                                variant="body-sm"
                                priority="secondary"
                            />
                        </Text>
                        {shouldShowNetworkBadge && <Badge label={getNetwork(networkSymbol).name} />}
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
                    balance &&
                    (!contractAddress ? (
                        <CompactCryptoAmountFormatter
                            value={balance.cryptoAmount}
                            symbol={networkSymbol}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        />
                    ) : (
                        <CompactTokenAmountFormatter
                            networkSymbol={networkSymbol}
                            contractAddress={contractAddress}
                            value={asDecimalTokenAmount(balance.cryptoAmount)}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        />
                    ))
                }
                isFirst={isFirst}
                isLast={isLast}
            />
        </Box>
    );
};
