import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { PaymentMethodDisplay, TradeInfoRow } from '@suite-native/trading-atoms';

import { type TradingHistoryDetailPaymentMethod } from '../../hooks/useTradingHistoryDetailInfo';

type TradingHistoryDetailPaymentMethodRowProps = {
    paymentMethod: TradingHistoryDetailPaymentMethod;
};

export const TradingHistoryDetailPaymentMethodRow = ({
    paymentMethod,
}: TradingHistoryDetailPaymentMethodRowProps) => (
    <TradeInfoRow>
        <Text color="contentSecondary" variant="body-sm">
            <Translation
                id={
                    paymentMethod.label === 'payment'
                        ? 'moduleTrading.tradeHistory.detail.info.paymentMethod'
                        : 'moduleTrading.tradeHistory.detail.info.payoutMethod'
                }
            />
        </Text>
        <PaymentMethodDisplay
            accessibilityLabel={paymentMethod.paymentMethodName ?? paymentMethod.paymentMethod}
            iconSize={24}
            paymentMethod={paymentMethod.paymentMethod}
            paymentMethodName={paymentMethod.paymentMethodName}
            spacing="sp8"
        />
    </TradeInfoRow>
);
