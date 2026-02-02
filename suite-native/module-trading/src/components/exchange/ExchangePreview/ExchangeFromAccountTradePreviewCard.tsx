import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { AccountLabel } from '@suite-native/labeling';
import { TradeSideCard } from '@suite-native/trading-atoms';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

export type ExchangeFromAccountTradePreviewCardProps = {
    quote?: ExchangeTrade;
    fromStringValue: string | undefined;
};

export const ExchangeFromAccountTradePreviewCard = ({
    quote,
    fromStringValue,
}: ExchangeFromAccountTradePreviewCardProps) => {
    const fromAccount = useSelector(selectExchangeSelectedSendAccount);

    if (!quote?.send || !fromAccount) {
        return null;
    }

    return (
        <TradeSideCard
            accountLabel={<AccountLabel account={fromAccount} />}
            cryptoId={quote.send}
            amount={
                <Text variant="hint" color="textAlertRed">
                    -{fromStringValue}
                </Text>
            }
            title={<Translation id="moduleTrading.tradingExchangePreviewScreen.fromAccount" />}
        />
    );
};
