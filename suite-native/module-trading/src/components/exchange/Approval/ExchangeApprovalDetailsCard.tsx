import { useSelector } from 'react-redux';

import { cryptoIdToSymbol, selectTradingExchangePreselectedQuote } from '@suite-common/trading';
import { Card } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TradeInfoHeader } from '@suite-native/trading-atoms';

import { LimitPicker } from './LimitPicker';
import { FeePicker } from '../../fees/FeePicker';
import { ProviderInfoRow } from '../../general/TradeInfo/ProviderInfoRow';

export const ExchangeApprovalDetailsCard = () => {
    const quote = useSelector(selectTradingExchangePreselectedQuote);

    if (!quote) {
        return null;
    }

    // TODO 22293 - set real values
    const fee = '4.76';
    const areFeesLoading = false;
    const goToFeeSelection = () => {};
    const networkSymbol = cryptoIdToSymbol(quote.send!)!;

    return (
        <Card noPadding>
            <TradeInfoHeader
                title={
                    <Translation id="moduleTrading.tradingExchangeApprovalScreen.approvalDetailsTitle" />
                }
            />
            <ProviderInfoRow exchange={quote.exchange} />
            <LimitPicker />
            <FeePicker
                fee={fee}
                symbol={networkSymbol}
                onPress={goToFeeSelection}
                isLoading={areFeesLoading}
            />
        </Card>
    );
};
