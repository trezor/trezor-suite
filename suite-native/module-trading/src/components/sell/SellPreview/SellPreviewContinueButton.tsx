import { memo } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import type { SellFiatTrade } from 'invity-api';

import { parseCryptoId } from '@suite-common/trading';
import { selectSendPrecomposedTx } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { selectSellSelectedSendAccount } from '@suite-native/trading-state';

export type SellPreviewContinueButtonProps = {
    isDisabled: boolean;
    quote?: SellFiatTrade;
    onSignTransactionNavigation: () => void;
};

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.TradingSellPreview>;

const SELL_PREVIEW_CONTINUE_BUTTON_TEST_ID = '@trading/sell-preview/continue-button';

export const SellPreviewContinueButton = memo(
    ({ isDisabled, quote, onSignTransactionNavigation }: SellPreviewContinueButtonProps) => {
        const navigation = useNavigation<NavigationProp>();

        const precomposedTransaction = useSelector(selectSendPrecomposedTx);
        const fromAccount = useSelector(selectSellSelectedSendAccount);

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

            const tokenContract = quote.cryptoCurrency
                ? (parseCryptoId(quote.cryptoCurrency)?.contractAddress as TokenAddress)
                : undefined;

            navigation.navigate(RootStackRoutes.TradingSellOutputsReview, {
                accountKey: fromAccount.key,
                tokenContract,
                orderId: quote.orderId ?? '',
            });
            onSignTransactionNavigation();
        };

        return (
            <Button
                onPress={handleSignTransaction}
                isDisabled={isDisabled}
                testID={SELL_PREVIEW_CONTINUE_BUTTON_TEST_ID}
            >
                <Translation id="generic.buttons.continue" />
            </Button>
        );
    },
);
