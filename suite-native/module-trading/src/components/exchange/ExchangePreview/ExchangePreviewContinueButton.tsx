import { memo } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import type { ExchangeTrade } from 'invity-api';

import { parseCryptoId } from '@suite-common/trading';
import { selectSendPrecomposedTx } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type AppTabsParamList,
    type StackToTabCompositeNavigationProp,
    type TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

export type ExchangePreviewContinueButtonProps = {
    isDisabled: boolean;
    quote?: ExchangeTrade;
    onSignTransactionNavigation: () => void;
};

type NavigationProp = StackToTabCompositeNavigationProp<
    TradingStackParamList,
    TradingStackRoutes.TradingExchangePreview,
    AppTabsParamList
>;

const EXCHANGE_PREVIEW_CONTINUE_BUTTON_TEST_ID = '@trading/exchange-preview/continue-button';

export const ExchangePreviewContinueButton = memo(
    ({ isDisabled, quote, onSignTransactionNavigation }: ExchangePreviewContinueButtonProps) => {
        const navigation = useNavigation<NavigationProp>();

        const precomposedTransaction = useSelector(selectSendPrecomposedTx);
        const fromAccount = useSelector(selectExchangeSelectedSendAccount);

        if (precomposedTransaction?.type !== 'final') {
            return null;
        }

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
                },
            });
            onSignTransactionNavigation();
        };

        return (
            <Button
                onPress={handleSignTransaction}
                isDisabled={isDisabled}
                testID={EXCHANGE_PREVIEW_CONTINUE_BUTTON_TEST_ID}
            >
                <Translation id="generic.buttons.continue" />
            </Button>
        );
    },
);
