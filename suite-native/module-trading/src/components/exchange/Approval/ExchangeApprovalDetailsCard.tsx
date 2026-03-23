import { useSelector } from 'react-redux';

import { selectTradingExchangeActiveQuote } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Card } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TradeInfoHeader } from '@suite-native/trading-atoms';

import { LimitPicker } from './LimitPicker';
import { FeePicker } from '../../fees/FeePicker';
import { ProviderInfoRow } from '../../general/TradeInfo/ProviderInfoRow';

type ExchangeApprovalDetailsCardProps = {
    fee: string | undefined;
    isLoading: boolean;
    networkSymbol: NetworkSymbol | undefined;
};

const noop = () => {};

export const ExchangeApprovalDetailsCard = ({
    fee,
    isLoading,
    networkSymbol,
}: ExchangeApprovalDetailsCardProps) => {
    const quote = useSelector(selectTradingExchangeActiveQuote);

    if (!quote || !networkSymbol) {
        return null;
    }

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
                fee={fee ?? '0'}
                symbol={networkSymbol}
                onPress={noop}
                isLoading={isLoading}
            />
        </Card>
    );
};
