import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import {
    type AccountKey,
    type TokenAddress,
    type TokenInfoBranded,
} from '@suite-common/wallet-types';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import {
    CoinToFiatAmountFormatter,
    ExactCryptoAmountFormatter,
    ExactTokenAmountFormatter,
    convertTokenValueToDecimal,
} from '@suite-native/formatters';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';

export type ReviewOutputItemValuesProps = {
    accountKey: AccountKey;
    value: string;
    translationKey: TxKeyPath;
    tokenContract?: TokenAddress;
};

type ReviewOutputCryptoAmountProps = {
    symbol: NetworkSymbol | null;
    tokenInfo: TokenInfoBranded | null;
    value: string;
};

const ReviewOutputCryptoAmount = ({ symbol, tokenInfo, value }: ReviewOutputCryptoAmountProps) => {
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

export const ReviewOutputItemValues = ({
    accountKey,
    value,
    translationKey,
    tokenContract,
}: ReviewOutputItemValuesProps) => {
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const tokenInfo = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenContract),
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
                    isDiscreetText={false}
                />
                <ReviewOutputCryptoAmount symbol={symbol} tokenInfo={tokenInfo} value={value} />
            </VStack>
        </HStack>
    );
};
