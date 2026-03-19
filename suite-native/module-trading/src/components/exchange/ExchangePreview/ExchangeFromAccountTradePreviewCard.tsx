import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TradeSideCard } from '@suite-native/trading-atoms';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

import { useChangeStringsExtractor } from '../../../hooks/history/useChangeStringsExtractor';
import { CryptoToFiatValueBadge } from '../../general/CryptoToFiatValueBadge';

export type ExchangeFromAccountTradePreviewCardProps = {
    quote?: ExchangeTrade;
};

export const ExchangeFromAccountTradePreviewCard = ({
    quote,
}: ExchangeFromAccountTradePreviewCardProps) => {
    const fromAccount = useSelector(selectExchangeSelectedSendAccount);
    const { fromStringValue, fromValue } = useChangeStringsExtractor(quote);

    if (!quote?.send || !fromAccount) {
        return null;
    }

    return (
        <TradeSideCard
            account={fromAccount}
            cryptoId={quote.send}
            amount={
                <Text variant="body-sm" color="textAlertRed">
                    -{fromStringValue}
                </Text>
            }
            title={<Translation id="moduleTrading.tradingExchangePreviewScreen.fromAccount" />}
        >
            {!!fromValue && (
                <CryptoToFiatValueBadge
                    amount={fromValue}
                    cryptoId={quote.send}
                    color="textSubdued"
                    textAlign="right"
                />
            )}
        </TradeSideCard>
    );
};
