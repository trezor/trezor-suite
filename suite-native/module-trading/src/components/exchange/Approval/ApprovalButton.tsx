import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectTradingExchangePreselectedQuote } from '@suite-common/trading';
import { AsyncButton, Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    StackNavigationProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';

import { useExchangeFlow } from '../../../hooks/exchange/useExchangeFlow';

export const ApprovalButton = () => {
    const navigation =
        useNavigation<
            StackNavigationProps<TradingStackParamList, TradingStackRoutes.TradingExchangeApproval>
        >();

    const { confirmTrade } = useExchangeFlow();

    const quote = useSelector(selectTradingExchangePreselectedQuote);

    const handleContinue = async () => {
        const success = await confirmTrade({
            receiveAddress: quote?.receiveAddress ?? '',
            trade: quote,
            approvalFlow: true,
            nextStep: () => {},
        });

        if (success) {
            // TODO
            navigation.navigate(TradingStackRoutes.TradingExchangePreview, { isApproved: true });
        }
    };

    if (!quote) {
        return null;
    }

    return (
        <Box paddingTop="sp20">
            <AsyncButton onPress={handleContinue}>
                <Translation id="generic.buttons.continue" />
            </AsyncButton>
        </Box>
    );
};
