import { type TradingTransactionBuy } from '@suite-common/trading';
import { BannerFull } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { getBuyTradeProgress, getTradeStatusUrl } from '../../utils/tradeStatusUtils';

type TradingHistoryDetailBuyPaymentBannerProps = {
    trade: TradingTransactionBuy;
};

export const TradingHistoryDetailBuyPaymentBanner = ({
    trade,
}: TradingHistoryDetailBuyPaymentBannerProps) => {
    const isWaitingForPayment = getBuyTradeProgress(trade.data.status) === 'customerAction';
    const isStatusLinkAvailable = !!getTradeStatusUrl(trade);

    if (!isWaitingForPayment || isStatusLinkAvailable) {
        return null;
    }

    return (
        <BannerFull
            title={
                <Translation id="moduleTrading.tradeHistory.detail.paymentInterruptionBanner.title" />
            }
            description={
                <Translation id="moduleTrading.tradeHistory.detail.paymentInterruptionBanner.description" />
            }
            iconName="arrowSquareOut"
            intent="info"
            testID="@trading-history/detail/payment-interruption-banner"
        />
    );
};
