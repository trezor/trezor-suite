import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { AccountLabel } from '@suite-native/labeling';
import { TradeSideCard } from '@suite-native/trading-atoms';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

import { CryptoToFiatValueBadge } from '../../general/CryptoToFiatValueBadge';

export type ExchangeFromAccountTradePreviewCardProps = {
    quote?: ExchangeTrade;
    fromStringValue: string | undefined;
    fromValue?: string;
};

export const ExchangeFromAccountTradePreviewCard = ({
    quote,
    fromStringValue,
    fromValue,
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
