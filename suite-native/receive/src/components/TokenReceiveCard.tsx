import { useSelector } from 'react-redux';

import { Badge, Box, ErrorMessage, RoundedIcon, Text, VStack } from '@suite-native/atoms';
import { TokenAmountFormatter, TokenToFiatAmountFormatter } from '@suite-native/formatters';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import {
    AccountsRootState,
    selectAccountLabel,
    selectAccountNetworkSymbol,
} from '@suite-common/wallet-core';
import {
    getTokenName,
    selectAccountTokenInfo,
    selectAccountTokenSymbol,
} from '@suite-native/tokens';
import { Translation } from '@suite-native/intl';

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

    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );
    const accountNetworkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    )!;
    const token = useSelector((state: AccountsRootState) =>
        selectAccountTokenInfo(state, accountKey, contract),
    );

    const tokenSymbol = useSelector((state: AccountsRootState) =>
        selectAccountTokenSymbol(state, accountKey, contract),
    );

    const network = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    if (!token || !network) {
        return (
            <ErrorMessage errorMessage={<Translation id="moduleReceive.tokens.errorMessage" />} />
        );
    }

    const tokenName = getTokenName(token.name);

    return (
        <VStack>
            <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                <Box flex={1} flexDirection="row" alignItems="center">
                    <Box marginRight="sp16">
                        <RoundedIcon name={contract} />
                    </Box>
                    <Box style={applyStyle(tokenDescriptionStyle)}>
                        <Text>{tokenName}</Text>
                        <Badge
                            label={
                                <Translation
                                    id="moduleReceive.tokens.runOn"
                                    values={{ accountLabel }}
                                />
                            }
                            icon={accountNetworkSymbol}
                            size="small"
                            iconSize="extraSmall"
                        />
                    </Box>
                </Box>
                <Box style={applyStyle(valuesContainerStyle)}>
                    <TokenToFiatAmountFormatter
                        value={token.balance ?? '0'}
                        contract={contract}
                        networkSymbol={network}
                    />
                    <TokenAmountFormatter
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
