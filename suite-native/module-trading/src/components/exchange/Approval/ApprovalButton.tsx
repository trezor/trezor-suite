import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { parseCryptoId, selectTradingExchangeSelectedQuote } from '@suite-common/trading';
import { type TokenAddress } from '@suite-common/wallet-types';
import { Box, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type StackNavigationProps,
    type TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

export type ApprovalButtonProps = {
    isReady: boolean;
    isDisabled?: boolean;
};

export const ApprovalButton = ({ isReady, isDisabled }: ApprovalButtonProps) => {
    const navigation =
        useNavigation<
            StackNavigationProps<TradingStackParamList, TradingStackRoutes.TradingExchangeApproval>
        >();

    const quote = useSelector(selectTradingExchangeSelectedQuote);
    const fromAccount = useSelector(selectExchangeSelectedSendAccount);

    if (!quote || !isReady) {
        return null;
    }

    const handleContinue = () => {
        const tokenContract = quote.send
            ? (parseCryptoId(quote.send)?.contractAddress as TokenAddress)
            : undefined;
        if (!fromAccount || !tokenContract) {
            console.warn('account or tokenContract is not defined');

            return;
        }
        navigation.navigate(TradingStackRoutes.TradingExchangeOutputsReview, {
            accountKey: fromAccount.key,
            tokenContract,
            orderId: quote.orderId ?? '',
        });
    };

    return (
        <Box paddingTop="sp20">
            <Button onPress={handleContinue} isDisabled={isDisabled}>
                <Translation id="generic.buttons.continue" />
            </Button>
        </Box>
    );
};
