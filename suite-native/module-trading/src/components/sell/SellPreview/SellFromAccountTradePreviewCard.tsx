import { useSelector } from 'react-redux';

import type { SellFiatTrade } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { selectSellSelectedSendAccount } from '@suite-native/trading-state';

import { TradeSideCard } from '../../general/TradeSideCard';

export type SellFromAccountTradePreviewCardProps = {
    quote?: SellFiatTrade;
    fromStringValue: string | undefined;
};

export const SellFromAccountTradePreviewCard = ({
    quote,
    fromStringValue,
}: SellFromAccountTradePreviewCardProps) => {
    const fromAccount = useSelector(selectSellSelectedSendAccount);

    if (!quote?.cryptoCurrency || !fromAccount) {
        return null;
    }

    return (
        <TradeSideCard
            account={fromAccount}
            cryptoId={quote.cryptoCurrency}
            amount={
                fromStringValue ? (
                    <Text variant="hint" color="textAlertRed">
                        -{fromStringValue}
                    </Text>
                ) : null
            }
            title={<Translation id="moduleTrading.tradingSellPreviewScreen.fromAccount" />}
        />
    );
};
