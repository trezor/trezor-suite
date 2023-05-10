import React from 'react';
import { TouchableOpacity } from 'react-native';

import { Box, Text } from '@suite-native/atoms';
import { EthereumTokenIcon } from '@trezor/icons';
import {
    EthereumTokenAmountFormatter,
    EthereumTokenToFiatAmountFormatter,
} from '@suite-native/formatters';
import { getEthereumTokenIconName } from '@suite-native/ethereum-tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { AccountKey, TokenAddress, TokenSymbol } from '@suite-common/wallet-types';

import { accountDescriptionStyle, valuesContainerStyle } from './AccountListItem';

type TokenListItemProps = {
    balance?: string;
    isLast: boolean;
    label: string;
    symbol: TokenSymbol;
    accountKey: AccountKey;
    contract: TokenAddress;
    onSelectAccount: (accountKey: AccountKey, tokenContract?: TokenAddress) => void;
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
    contract,
    balance,
    isLast,
    label,
    accountKey,
    onSelectAccount,
}: TokenListItemProps) => {
    const { applyStyle } = useNativeStyles();

    const handleOnPress = () => {
        onSelectAccount(accountKey, contract);
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
                    <Box flex={1} flexDirection="row" alignItems="center">
                        <Box marginRight="small">
                            <EthereumTokenIcon name={iconName} />
                        </Box>
                        <Text style={applyStyle(accountDescriptionStyle)}>{label}</Text>
                    </Box>
                    <Box style={applyStyle(valuesContainerStyle)}>
                        <EthereumTokenToFiatAmountFormatter
                            value={balance ?? '0'}
                            ethereumToken={symbol.toUpperCase() as TokenSymbol}
                            contract={contract}
                        />
                        <EthereumTokenAmountFormatter
                            value={balance ?? '0'}
                            ethereumToken={symbol}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        />
                    </Box>
                </Box>
            </TouchableOpacity>
        </>
    );
};
