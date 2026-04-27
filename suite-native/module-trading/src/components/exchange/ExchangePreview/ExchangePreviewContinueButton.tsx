import { memo } from 'react';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    isFinalStatus,
    parseCryptoId,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';
import { selectSendPrecomposedTx } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { Box, Button, ScreenFooterGradient } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type AppTabsParamList,
    type StackToTabCompositeNavigationProp,
    type TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export type ExchangePreviewContinueButtonProps = {
    isDisabled: boolean;
    onSignTransactionNavigation: () => void;
};

type NavigationProp = StackToTabCompositeNavigationProp<
    TradingStackParamList,
    TradingStackRoutes.TradingExchangePreview,
    AppTabsParamList
>;

const footerStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
}));

const EXCHANGE_PREVIEW_CONTINUE_BUTTON_TEST_ID = '@trading/exchange-preview/continue-button';

export const ExchangePreviewContinueButton = memo(
    ({ isDisabled, onSignTransactionNavigation }: ExchangePreviewContinueButtonProps) => {
        const navigation = useNavigation<NavigationProp>();
        const { applyStyle } = useNativeStyles();

        const quote = useSelector(selectTradingExchangeSelectedQuote);
        const precomposedTransaction = useSelector(selectSendPrecomposedTx);
        const fromAccount = useSelector(selectExchangeSelectedSendAccount);
        const isTXFinalType = precomposedTransaction?.type === 'final';
        const isTradeFinalized = isFinalStatus('exchange', quote?.status);

        const handleSignTransaction = () => {
            if (!quote || !fromAccount) {
                console.warn('quote or fromAccount is not defined', {
                    hasQuote: !!quote,
                    hasFromAccount: !!fromAccount,
                });

                return;
            }

            const tokenContract = quote.send
                ? (parseCryptoId(quote.send)?.contractAddress as TokenAddress)
                : undefined;

            navigation.navigate({
                name: TradingStackRoutes.TradingExchangeOutputsReview,
                params: {
                    accountKey: fromAccount.key,
                    tokenContract,
                    orderId: quote.orderId ?? '',
                    flowType: 'swap',
                },
            });
            onSignTransactionNavigation();
        };

        if (isTradeFinalized) {
            return null;
        }

        if (isDisabled && !isTXFinalType) {
            return null;
        }

        return (
            <Animated.View entering={FadeInDown} exiting={FadeOut}>
                <ScreenFooterGradient />
                <Box style={applyStyle(footerStyle)}>
                    <Button
                        onPress={handleSignTransaction}
                        isDisabled={isDisabled}
                        isLoading={!isTXFinalType}
                        testID={EXCHANGE_PREVIEW_CONTINUE_BUTTON_TEST_ID}
                    >
                        <Translation id="generic.buttons.continue" />
                    </Button>
                </Box>
            </Animated.View>
        );
    },
);
