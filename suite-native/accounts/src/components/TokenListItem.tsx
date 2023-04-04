import React from 'react';
import { TouchableOpacity } from 'react-native';

import { Box, Text } from '@suite-native/atoms';
import { EthereumTokenIcon } from '@trezor/icons';
import {
    EthereumTokenAmountFormatter,
    EthereumTokenToFiatAmountFormatter,
} from '@suite-native/formatters';
import { EthereumTokenSymbol, getEthereumTokenIconName } from '@suite-native/ethereum-tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { AccountKey } from '@suite-common/wallet-types';

type TokenListItemProps = {
    balance: string;
    isLast: boolean;
    label: string;
    symbol: EthereumTokenSymbol;
    accountKey: AccountKey;
    onSelectAccount: (accountKey: AccountKey, tokenSymbol?: EthereumTokenSymbol) => void;
};

const tokenListItemStyle = prepareNativeStyle<{ isLast: boolean }>((utils, { isLast }) => ({
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
    marginLeft: utils.spacings.medium + utils.spacings.large / 2,
}));

export const TokenListItem = ({
    symbol,
    balance,
    isLast,
    label,
    accountKey,
    onSelectAccount,
}: TokenListItemProps) => {
    const { applyStyle } = useNativeStyles();

    const handleOnPress = () => {
        onSelectAccount(accountKey, symbol);
    };

    const iconName = getEthereumTokenIconName(symbol);

    return (
        <>
            <TouchableOpacity onPress={handleOnPress}>
                <Box style={applyStyle(horizontalLine)} />
                <Box
                    flexDirection="row"
                    justifyContent="space-between"
                    alignItems="center"
                    style={applyStyle(tokenListItemStyle, { isLast })}
                >
                    <Box flexDirection="row">
                        <Box marginRight="small">
                            <EthereumTokenIcon name={iconName} />
                        </Box>
                        <Text>{label}</Text>
                    </Box>
                    <Box alignItems="flex-end">
                        <EthereumTokenToFiatAmountFormatter
                            value={balance}
                            ethereumToken={symbol}
                        />
                        <EthereumTokenAmountFormatter value={balance} ethereumToken={symbol} />
                    </Box>
                </Box>
            </TouchableOpacity>
        </>
    );
};
