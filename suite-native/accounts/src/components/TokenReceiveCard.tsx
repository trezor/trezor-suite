import { useSelector } from 'react-redux';

import { type SuiteSyncDataRootState, selectSuiteSyncAccountLabel } from '@suite-common/suite-sync';
import {
    type AccountsRootState,
    selectAccountByKey,
    selectAccountNetworkSymbol,
    selectFormattedAccountType,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { parseAccountKey, parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { Badge, Box, ErrorMessage, HStack, Text, VStack } from '@suite-native/atoms';
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

    const { accountDescriptor, networkSymbol, deviceStaticSessionId } = parseAccountKey(accountKey);
    const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const formattedAccountType = useSelector((state: AccountsRootState) =>
        selectFormattedAccountType(state, accountKey),
    );
    const accountLabel =
        useSelector((state: AccountsRootState & SuiteSyncDataRootState) =>
            selectSuiteSyncAccountLabel(state, walletDescriptor, accountDescriptor, networkSymbol),
        ) ??
        account?.accountLabel ??
        '';

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

    return (
        <VStack>
            <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                <Box flex={1} flexDirection="row" alignItems="center">
                    <Box marginRight="sp16">
                        <CryptoIconWithNetwork symbol={symbol} contractAddress={contract} />
                    </Box>
                    <Box style={applyStyle(tokenDescriptionStyle)}>
                        <Text>{tokenName}</Text>

                        <HStack alignItems="center" spacing="sp4">
                            <Text
                                variant="body-xs"
                                color="contentSecondary"
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {accountLabel}
                            </Text>

                            {formattedAccountType && (
                                <Badge label={formattedAccountType} size="small" />
                            )}
                        </HStack>
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
