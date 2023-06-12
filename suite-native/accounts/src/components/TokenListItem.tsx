import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { Box, RoundedIcon, Text } from '@suite-native/atoms';
import {
    EthereumTokenAmountFormatter,
    EthereumTokenToFiatAmountFormatter,
} from '@suite-native/formatters';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { selectEthereumAccountTokenSymbol } from '@suite-native/ethereum-tokens';
import { AccountsRootState } from '@suite-common/wallet-core';

import { accountDescriptionStyle, valuesContainerStyle } from './AccountListItem';

type TokenListItemProps = {
    balance?: string;
    isLast: boolean;
    label: string;
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
    marginVertical: utils.spacings.small / 2,
    marginLeft: utils.spacings.medium + utils.spacings.large,
}));

export const TokenListItem = ({
    contract,
    balance,
    isLast,
    label,
    accountKey,
    onSelectAccount,
}: TokenListItemProps) => {
    const { applyStyle } = useNativeStyles();

    const tokenSymbol = useSelector((state: AccountsRootState) =>
        selectEthereumAccountTokenSymbol(state, accountKey, contract),
    );

    const handleOnPress = () => {
        onSelectAccount(accountKey, contract);
    };

    return (
        <TouchableOpacity onPress={handleOnPress}>
            <Box style={applyStyle(horizontalLine)} />
            <Box
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
                style={applyStyle(tokenListItemStyle, { isLast })}
            >
                <Box flex={1} flexDirection="row" alignItems="center">
                    <Box marginRight="medium">
                        <RoundedIcon name={contract} />
                    </Box>
                    <Text style={applyStyle(accountDescriptionStyle)}>{label}</Text>
                </Box>
                <Box style={applyStyle(valuesContainerStyle)}>
                    <EthereumTokenToFiatAmountFormatter
                        value={balance ?? '0'}
                        contract={contract}
                    />
                    <EthereumTokenAmountFormatter
                        value={balance ?? '0'}
                        symbol={tokenSymbol}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    />
                </Box>
            </Box>
        </TouchableOpacity>
    );
};
