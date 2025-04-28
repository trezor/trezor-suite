import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    TradingRootState,
    TradingTransactionBuy,
    TradingTransactionSell,
    selectTradingTradeByOrderId,
} from '@suite-common/trading';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

import { buildTradingUrl } from '../../../utils/tradeFormUtils';

type TradeDetailPaymentButtonProps = {
    orderId: string;
    onOpenedWebview: () => void;
};

export const TradeDetailPaymentButton = ({
    orderId,
    onOpenedWebview,
}: TradeDetailPaymentButtonProps) => {
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();
    const trade = useSelector((state: TradingRootState) =>
        selectTradingTradeByOrderId(state, orderId),
    );
    if (!trade) {
        return null;
    }

    const handleTradeLinkPress = () => {
        if (['buy', 'sell'].includes(trade.tradeType)) {
            const buyOrSell = trade as TradingTransactionBuy | TradingTransactionSell;
            if (buyOrSell.data.partnerData) {
                onOpenedWebview();
                navigation.navigate(RootStackRoutes.TradingWebView, {
                    closeCallbackUrl: buildTradingUrl({
                        actionType: 'trade',
                        tradeType: trade.tradeType,
                        orderId,
                    }),
                    source: { uri: buyOrSell.data.partnerData },
                });
            }
        }
    };

    return (
        <Button onPress={handleTradeLinkPress}>
            <Translation id="moduleTrading.tradeHistory.detail.buttons.proceedToPay" />
        </Button>
    );
};
