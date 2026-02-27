import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { AccountLabel } from '@suite-native/labeling';
import { TradeSideCard } from '@suite-native/trading-atoms';
import { selectExchangeSelectedReceiveAccount } from '@suite-native/trading-state';

import { useChangeStringsExtractor } from '../../../hooks/history/useChangeStringsExtractor';
import { CryptoToFiatValueBadge } from '../../general/CryptoToFiatValueBadge';

export type ExchangeToAccountTradePreviewCardProps = {
    quote?: ExchangeTrade;
};

export const ExchangeToAccountTradePreviewCard = ({
    quote,
}: ExchangeToAccountTradePreviewCardProps) => {
    const toAccount = useSelector(selectExchangeSelectedReceiveAccount);
    const { toStringValue, toValue } = useChangeStringsExtractor(quote);

    if (!quote?.receive || !toAccount?.account) {
        return null;
    }

    return (
        <TradeSideCard
            accountLabel={<AccountLabel account={toAccount.account} />}
            cryptoId={quote.receive}
            amount={
                !!toStringValue && (
                    <Text variant="body-sm" color="textSecondaryHighlight">
                        +{toStringValue}
                    </Text>
                )
            }
            title={<Translation id="moduleTrading.tradingExchangePreviewScreen.toAccount" />}
        >
            {!!toValue && (
                <CryptoToFiatValueBadge
                    amount={toValue}
                    cryptoId={quote.receive}
                    color="textSubdued"
                    textAlign="right"
                />
            )}
        </TradeSideCard>
    );
};
