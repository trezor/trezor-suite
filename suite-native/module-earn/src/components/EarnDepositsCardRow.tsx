import React from 'react';

import { Box, CardDivider, HStack, PressableOpacity, Text } from '@suite-native/atoms';
import { CryptoIconWithNetwork, Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type EarnDepositsCardRow as EarnDepositsCardRowType } from '../types';

const rowStyle = prepareNativeStyle(utils => ({
    minHeight: 70,
    paddingLeft: utils.spacings.sp16,
    paddingRight: utils.spacings.sp12,
    paddingVertical: utils.spacings.sp12,
    flexDirection: 'row',
    alignItems: 'center',
}));

const rowTextContainerStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

const rowIconsContainerStyle = prepareNativeStyle(_ => ({
    flexDirection: 'row',
    alignItems: 'center',
}));

const rowIconWrapperStyle = prepareNativeStyle((utils, { index }: { index: number }) => ({
    marginLeft: index === 0 ? 0 : -utils.spacings.sp8,
    zIndex: 3 - index,
}));

const MAX_VISIBLE_ROW_ICONS = 3;

const getRowItemIconKey = (rowItem: EarnDepositsCardRowType['activeItems'][number]) =>
    rowItem.type === 'staking'
        ? `${rowItem.type}:${rowItem.symbol}`
        : `${rowItem.type}:${rowItem.networkSymbol}:${rowItem.tokenContractAddress}`;

const getVisibleRowIcons = (row: EarnDepositsCardRowType) =>
    row.activeItems.reduce<typeof row.activeItems>((uniqueItems, rowItem) => {
        const iconKey = getRowItemIconKey(rowItem);

        if (uniqueItems.some(existingItem => getRowItemIconKey(existingItem) === iconKey)) {
            return uniqueItems;
        }

        return [...uniqueItems, rowItem];
    }, []);

type EarnDepositsCardRowProps = {
    row: EarnDepositsCardRowType;
    onPress: () => void;
};

export const EarnDepositsCardRow = React.memo(({ row, onPress }: EarnDepositsCardRowProps) => {
    const { applyStyle } = useNativeStyles();
    const visibleIcons = getVisibleRowIcons(row);

    return (
        <Box>
            <CardDivider />
            <PressableOpacity
                onPress={onPress}
                style={applyStyle(rowStyle)}
                testID={`@earn/deposits-card/${row.type}`}
            >
                <Box style={applyStyle(rowTextContainerStyle)}>
                    <Text variant="body-md">{row.title}</Text>
                </Box>
                <HStack spacing="sp12" alignItems="center">
                    <Box style={applyStyle(rowIconsContainerStyle)}>
                        {visibleIcons.slice(0, MAX_VISIBLE_ROW_ICONS).map((item, index) => (
                            <Box
                                key={`${getRowItemIconKey(item)}-${index}`}
                                style={applyStyle(rowIconWrapperStyle, { index })}
                            >
                                <CryptoIconWithNetwork
                                    symbol={
                                        item.type === 'staking' ? item.symbol : item.networkSymbol
                                    }
                                    contractAddress={
                                        item.type === 'stablecoin-yield'
                                            ? item.tokenContractAddress
                                            : undefined
                                    }
                                    size="extraSmall"
                                />
                            </Box>
                        ))}
                    </Box>
                    <Icon name="caretRight" size="mediumLarge" color="contentSecondary" />
                </HStack>
            </PressableOpacity>
        </Box>
    );
});
