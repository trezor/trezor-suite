import React from 'react';
import { useSelector } from 'react-redux';

import { AlertBox, Badge, Box, ErrorMessage, RoundedIcon, Text, VStack } from '@suite-native/atoms';
import {
    EthereumTokenAmountFormatter,
    EthereumTokenToFiatAmountFormatter,
} from '@suite-native/formatters';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { AccountsRootState, selectAccountLabel } from '@suite-common/wallet-core';
import {
    getEthereumTokenName,
    selectEthereumAccountTokenInfo,
    selectEthereumAccountTokenSymbol,
} from '@suite-native/ethereum-tokens';

type TokenReceiveCardProps = {
    accountKey: AccountKey;
    contract: TokenAddress;
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

export const TokenReceiveCard = ({ contract, accountKey }: TokenReceiveCardProps) => {
    const { applyStyle } = useNativeStyles();

    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );

    const token = useSelector((state: AccountsRootState) =>
        selectEthereumAccountTokenInfo(state, accountKey, contract),
    );

    const tokenSymbol = useSelector((state: AccountsRootState) =>
        selectEthereumAccountTokenSymbol(state, accountKey, contract),
    );

    if (!token) return <ErrorMessage errorMessage="Token not found." />;

    const tokenName = getEthereumTokenName(token.name);

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
                        <RoundedIcon name={contract} />
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
                        value={token.balance ?? '0'}
                        contract={contract}
                    />
                    <EthereumTokenAmountFormatter
                        value={token.balance ?? '0'}
                        symbol={tokenSymbol}
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
