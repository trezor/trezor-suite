import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    TradingRootState,
    TradingTransaction,
    TradingTransactionBuy,
    TradingTransactionSell,
    selectTradingTradeByOrderId,
} from '@suite-common/trading';
import { FullAlertBox } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

import { buildTradingUrl } from '../../../utils/tradeFormUtils';

const isBuyOrSell = (
    trade?: TradingTransaction,
): trade is TradingTransactionBuy | TradingTransactionSell =>
    !!trade && ['buy', 'sell'].includes(trade.tradeType);

type TradeDetailWaitingAlertProps = {
    orderId: string;
    onOpenedWebview: () => void;
};

export const TradeDetailWaitingAlert = ({
    orderId,
    onOpenedWebview,
}: TradeDetailWaitingAlertProps) => {
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();
    const trade = useSelector((state: TradingRootState) =>
        selectTradingTradeByOrderId(state, orderId),
    );

    const { translate } = useTranslate();

    const handleTradeLinkPress =
        isBuyOrSell(trade) && trade.data.partnerData
            ? () => {
                  onOpenedWebview();
                  navigation.navigate(RootStackRoutes.TradingWebView, {
                      closeCallbackUrl: buildTradingUrl({
                          actionType: 'trade',
                          tradeType: trade.tradeType,
                          orderId,
                      }),
                      source: { uri: trade.data.partnerData },
                  });
              }
            : undefined;

    return (
        <FullAlertBox
            title={translate('moduleTrading.tradeHistory.detail.waitingAlert.title')}
            description={translate('moduleTrading.tradeHistory.detail.waitingAlert.description')}
            iconName="hourglass"
            primaryButtonLabel={
                handleTradeLinkPress &&
                translate('moduleTrading.tradeHistory.detail.waitingAlert.button')
            }
            primaryButtonProps={{ viewLeft: 'arrowSquareOut' }}
            onPressPrimaryButton={handleTradeLinkPress}
            variant="neutral"
        />
    );
};
