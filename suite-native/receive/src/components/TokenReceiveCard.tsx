import { useSelector } from 'react-redux';

import { Badge, Box, ErrorMessage, RoundedIcon, Text, VStack } from '@suite-native/atoms';
import {
    EthereumTokenAmountFormatter,
    EthereumTokenToFiatAmountFormatter,
} from '@suite-native/formatters';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { AccountsRootState, selectAccountLabel } from '@suite-common/wallet-core';
import {
    getTokenName,
    selectAccountTokenInfo,
    selectAccountTokenSymbol,
} from '@suite-native/tokens';

type TokenReceiveCardProps = {
    accountKey: AccountKey;
    contract: TokenAddress;
};

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
        selectAccountTokenInfo(state, accountKey, contract),
    );

    const tokenSymbol = useSelector((state: AccountsRootState) =>
        selectAccountTokenSymbol(state, accountKey, contract),
    );

    if (!token) return <ErrorMessage errorMessage="Token not found." />;

    const tokenName = getTokenName(token.name);

    return (
        <VStack>
            <Box flexDirection="row" justifyContent="space-between" alignItems="center">
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
        </VStack>
    );
};
