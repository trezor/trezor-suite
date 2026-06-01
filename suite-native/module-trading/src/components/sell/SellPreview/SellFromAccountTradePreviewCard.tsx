import { useSelector } from 'react-redux';

import type { SellFiatTrade } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TradeSideCard } from '@suite-native/trading-atoms';
import {
    CryptoToFiatValueBadge,
    useChangeStringsExtractor,
} from '@suite-native/trading-quote-utils';
import { selectSellSelectedSendAccount } from '@suite-native/trading-state';

export type SellFromAccountTradePreviewCardProps = {
    quote?: SellFiatTrade;
};

export const SellFromAccountTradePreviewCard = ({
    quote,
}: SellFromAccountTradePreviewCardProps) => {
    const fromAccount = useSelector(selectSellSelectedSendAccount);
    const { fromStringValue, fromValue } = useChangeStringsExtractor(quote);
    const cryptoId = quote?.cryptoCurrency;

    if (!cryptoId || !fromAccount) {
        return null;
    }

    return (
        <TradeSideCard
            account={fromAccount}
            cryptoId={cryptoId}
            amount={
                fromStringValue ? (
                    <Text variant="body-sm" color="contentCritical">
                        -{fromStringValue}
                    </Text>
                ) : null
            }
            title={<Translation id="moduleTrading.tradingSellPreviewScreen.fromAccount" />}
        >
            {!!fromValue && (
                <CryptoToFiatValueBadge
                    amount={fromValue}
                    cryptoId={cryptoId}
                    color="contentSecondary"
                    textAlign="right"
                />
            )}
        </TradeSideCard>
    );
};
