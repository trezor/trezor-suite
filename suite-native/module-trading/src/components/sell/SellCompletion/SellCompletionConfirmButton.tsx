import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import type { SellFiatTrade } from 'invity-api';

import { parseCryptoId } from '@suite-common/trading';
import { selectSendPrecomposedTx } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { Box, Button, ScreenFooterGradient } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { selectSellSelectedSendAccount } from '@suite-native/trading-state';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export type SellCompletionConfirmButtonProps = {
    quote: SellFiatTrade;
};

type NavigationProp = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.TradingSellCompletion
>;

const SELL_COMPLETION_CONFIRM_BUTTON_TEST_ID = '@trading/sell-completion/confirm-button';

const footerStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
}));

export const SellCompletionConfirmButton = ({ quote }: SellCompletionConfirmButtonProps) => {
    const navigation = useNavigation<NavigationProp>();
    const { applyStyle } = useNativeStyles();

    const precomposedTransaction = useSelector(selectSendPrecomposedTx);
    const fromAccount = useSelector(selectSellSelectedSendAccount);

    if (precomposedTransaction?.type !== 'final') {
        return null;
    }

    const handleSignTransaction = () => {
        if (!fromAccount) {
            console.warn('fromAccount is not defined');

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
    };

    return (
        <Box>
            <ScreenFooterGradient />
            <Box style={applyStyle(footerStyle)}>
                <Button
                    onPress={handleSignTransaction}
                    testID={SELL_COMPLETION_CONFIRM_BUTTON_TEST_ID}
                >
                    <Translation id="moduleTrading.tradingSellCompletionScreen.confirmOnTrezorAndSend" />
                </Button>
            </Box>
        </Box>
    );
};
