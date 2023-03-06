import React from 'react';

import { Box, Text } from '@suite-native/atoms';
import { Icon } from '@trezor/icons';
import { EthereumTokenAmountFormatter, TokenToFiatAmountFormatter } from '@suite-native/formatters';
import { EthereumTokenSymbol } from '@suite-native/ethereum-tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type TokenListItemProps = {
    balance: string;
    isLast: boolean;
    symbol: EthereumTokenSymbol;
};

const accountListItemStyle = prepareNativeStyle<{ isLast: boolean }>((utils, { isLast }) => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    paddingHorizontal: utils.spacings.medium,
    borderRadius: utils.borders.radii.medium,
    extend: {
        condition: isLast,
        style: {
            paddingBottom: utils.spacings.medium,
        },
    },
}));

const horizontalLine = prepareNativeStyle(utils => ({
    width: 1,
    height: utils.spacings.medium,
    borderLeftColor: utils.colors.borderDashed,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    marginLeft: utils.spacings.medium + utils.spacings.large / 2,
}));

export const TokenListItem = ({ symbol, balance, isLast }: TokenListItemProps) => {
    const { applyStyle } = useNativeStyles();

    const getAccountLabel = () => `${symbol} ${Math.random()}`;

    return (
        <Box>
            <Box style={applyStyle(horizontalLine)} />
            <Box
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
                style={applyStyle(accountListItemStyle, { isLast })}
            >
                <Box flexDirection="row">
                    <Box marginRight="small">
                        <Icon name="eye" />
                    </Box>
                    <Text>{getAccountLabel()}</Text>
                </Box>
                <Box alignItems="flex-end">
                    <TokenToFiatAmountFormatter value={balance} ethereumToken={symbol} />
                    <EthereumTokenAmountFormatter value={balance} ethereumToken={symbol} />
                </Box>
            </Box>
        </Box>
    );
};
