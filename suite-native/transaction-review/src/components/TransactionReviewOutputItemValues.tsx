import { useSelector } from 'react-redux';

import { useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import {
    CoinToFiatAmountFormatter,
    ExactCryptoAmountFormatter,
    ExactTokenAmountFormatter,
    convertTokenValueToDecimal,
} from '@suite-native/formatters';
import { Translation, type TxKeyPath } from '@suite-native/intl';

interface TransactionReviewOutputItemCryptoAmountProps {
    symbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    value: string;
}

const TransactionReviewOutputItemCryptoAmount = ({
    symbol,
    tokenContract,
    value,
}: TransactionReviewOutputItemCryptoAmountProps) => {
    const token = useTokenMetadata(symbol, tokenContract);
    if (tokenContract) {
        return (
            <ExactTokenAmountFormatter
                networkSymbol={symbol}
                contractAddress={tokenContract}
                variant="body-sm"
                color="contentSecondary"
                value={convertTokenValueToDecimal(value, token?.decimals ?? 0)}
                adjustsFontSizeToFit
                numberOfLines={1}
                // The user must be able to verify the token amount before signing.
                discreetMode="disabled"
            />
        );
    }

    return (
        <ExactCryptoAmountFormatter
            variant="body-sm"
            color="contentSecondary"
            value={value}
            symbol={symbol}
            isBalance={false}
            adjustsFontSizeToFit
            numberOfLines={1}
            // The user must be able to verify the crypto amount before signing.
            discreetMode="disabled"
        />
    );
};

interface TransactionReviewOutputItemValuesProps {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    value: string;
    translationKey: TxKeyPath;
}

export const TransactionReviewOutputItemValues = ({
    accountKey,
    tokenContract,
    value,
    translationKey,
}: TransactionReviewOutputItemValuesProps) => {
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    return (
        <HStack>
            <Box flex={0.4} justifyContent="center">
                <Text variant="body-sm">
                    <Translation id={translationKey} />
                </Text>
            </Box>

            <VStack flex={0.6} alignItems="flex-end" spacing="sp4">
                <CoinToFiatAmountFormatter
                    variant="body-sm"
                    color="contentPrimary"
                    value={value}
                    accountKey={accountKey}
                    tokenContract={tokenContract}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    // Show the fiat equivalent so the user can assess the transaction amount.
                    discreetMode="disabled"
                />

                {symbol && (
                    <TransactionReviewOutputItemCryptoAmount
                        symbol={symbol}
                        tokenContract={tokenContract}
                        value={value}
                    />
                )}
            </VStack>
        </HStack>
    );
};
