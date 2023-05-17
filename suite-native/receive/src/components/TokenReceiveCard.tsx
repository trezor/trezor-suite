import React from 'react';
import { useSelector } from 'react-redux';

import { AlertBox, Badge, Box, RoundedIcon, Text, VStack } from '@suite-native/atoms';
import {
    EthereumTokenAmountFormatter,
    EthereumTokenToFiatAmountFormatter,
} from '@suite-native/formatters';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { AccountKey, TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import { AccountsRootState, selectAccountLabel } from '@suite-common/wallet-core';

type TokenReceiveCardProps = {
    tokenSymbol?: TokenSymbol;
    tokenName: string;
    accountKey: AccountKey;
    contract: TokenAddress;
    balance?: string;
};

const tokenReceiveCardStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    padding: utils.spacings.medium,

    borderRadius: utils.borders.radii.medium,
}));

const tokenDescriptionStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
}));

const valuesContainerStyle = prepareNativeStyle(utils => ({
    maxWidth: '40%',
    flexShrink: 0,
    alignItems: 'flex-end',
    paddingLeft: utils.spacings.small,
}));

export const TokenReceiveCard = ({
    tokenSymbol,
    contract,
    balance,
    tokenName,
    accountKey,
}: TokenReceiveCardProps) => {
    const { applyStyle } = useNativeStyles();

    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );

    return (
        <VStack>
            <Box
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
                style={applyStyle(tokenReceiveCardStyle)}
            >
                <Box flex={1} flexDirection="row" alignItems="center">
                    <Box marginRight="medium">
                        <RoundedIcon name={tokenSymbol} />
                    </Box>
                    <Box style={applyStyle(tokenDescriptionStyle)}>
                        <Text>{tokenName}</Text>
                        <Badge
                            label={`Run on ${accountLabel}`}
                            icon="eth"
                            size="small"
                            iconSize="extraSmall"
                        />
                    </Box>
                </Box>
                <Box style={applyStyle(valuesContainerStyle)}>
                    <EthereumTokenToFiatAmountFormatter
                        value={balance ?? '0'}
                        ethereumToken={tokenSymbol}
                        contract={contract}
                    />
                    <EthereumTokenAmountFormatter
                        value={balance ?? '0'}
                        ethereumToken={tokenSymbol}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    />
                </Box>
            </Box>
            <AlertBox
                title="Your receive address is your Ethereum address."
                isIconVisible={false}
            />
        </VStack>
    );
};
