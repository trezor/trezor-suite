import { useSelector } from 'react-redux';

import { getNetwork } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { Badge, Box, ErrorMessage, Text, VStack } from '@suite-native/atoms';
import { TokenAmountFormatter, TokenToFiatAmountFormatter } from '@suite-native/formatters';
import { CryptoIconWithNetwork } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { type TokensRootState, getTokenName, selectAccountTokenInfo } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

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
    paddingLeft: utils.spacings.sp8,
}));

export const TokenReceiveCard = ({ contract, accountKey }: TokenReceiveCardProps) => {
    const { applyStyle } = useNativeStyles();
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const token = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, contract),
    );

    if (!token || !symbol) {
        return (
            <ErrorMessage errorMessage={<Translation id="moduleAccounts.tokens.errorMessage" />} />
        );
    }

    const tokenName = getTokenName(token.name);

    const networkName = getNetwork(symbol).name;

    return (
        <VStack>
            <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                <Box flex={1} flexDirection="row" alignItems="center">
                    <Box marginRight="sp16">
                        <CryptoIconWithNetwork symbol={symbol} contractAddress={contract} />
                    </Box>
                    <Box style={applyStyle(tokenDescriptionStyle)}>
                        <Text>{tokenName}</Text>
                        <Badge
                            label={
                                <Translation
                                    id="moduleAccounts.tokens.runOn"
                                    values={{ networkName }}
                                />
                            }
                            size="small"
                        />
                    </Box>
                </Box>
                <Box style={applyStyle(valuesContainerStyle)}>
                    <TokenToFiatAmountFormatter
                        value={token.balance ?? '0'}
                        contract={contract}
                        symbol={symbol}
                    />
                    <TokenAmountFormatter
                        value={token.balance ?? '0'}
                        tokenSymbol={token.symbol}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    />
                </Box>
            </Box>
        </VStack>
    );
};
