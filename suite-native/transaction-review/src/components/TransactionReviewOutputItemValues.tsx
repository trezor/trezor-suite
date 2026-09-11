import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { TokenInfoBranded } from '@suite-common/wallet-types';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import {
    CoinToFiatAmountFormatter,
    ExactCryptoAmountFormatter,
    ExactTokenAmountFormatter,
    convertTokenValueToDecimal,
} from '@suite-native/formatters';
import { Translation, TxKeyPath } from '@suite-native/intl';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';
import { useSelector } from 'react-redux';
import { useTransactionReview } from '../hooks/useTransactionReview';

interface TransactionReviewOutputItemCryptoAmountProps {
    symbol: NetworkSymbol | null;
    tokenInfo: TokenInfoBranded | null;
    value: string;
}

const TransactionReviewOutputItemCryptoAmount = ({
    symbol,
    tokenInfo,
    value,
}: TransactionReviewOutputItemCryptoAmountProps) => {
    if (tokenInfo !== null && value !== '') {
        return (
            <ExactTokenAmountFormatter
                variant="body-sm"
                color="contentSecondary"
                value={convertTokenValueToDecimal(value, tokenInfo.decimals)}
                tokenSymbol={tokenInfo.symbol}
                maxDisplayedDecimals={tokenInfo.decimals}
                adjustsFontSizeToFit
                numberOfLines={1}
                isDiscreetText={false}
            />
        );
    }

    if (symbol === null) {
        return null;
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
            isDiscreetText={false}
        />
    );
};

interface TransactionReviewOutputItemValuesProps {
    value: string;
    translationKey: TxKeyPath;
}

export const TransactionReviewOutputItemValues = ({
    value,
    translationKey,
}: TransactionReviewOutputItemValuesProps) => {
    const review = useTransactionReview();

    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, review.account?.key),
    );
    const tokenInfo = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, review.account?.key, review.tokenContract),
    );

    if (!review.account) return null;

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
                    accountKey={review.account?.key}
                    tokenContract={review.tokenContract}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    isDiscreetText={false}
                />

                <TransactionReviewOutputItemCryptoAmount
                    symbol={symbol}
                    tokenInfo={tokenInfo}
                    value={value}
                />
            </VStack>
        </HStack>
    );
};
