import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    type TradingTradeType,
    useTradingFormattedRequestedAmountShortfall,
} from '@suite-common/trading';
import { Text } from '@suite-native/atoms';
import { Translation, selectLocale } from '@suite-native/intl';

export type RequestedAmountShortfallNoteProps = {
    quote: TradingTradeType;
};

export const RequestedAmountShortfallNote = ({ quote }: RequestedAmountShortfallNoteProps) => {
    const locale = useSelector(selectLocale);
    const shortfall = useTradingFormattedRequestedAmountShortfall({ quote });

    const percentFormatter = useMemo(
        () =>
            new Intl.NumberFormat(locale, {
                style: 'percent',
                maximumFractionDigits: 1,
            }),
        [locale],
    );

    if (!shortfall) {
        return null;
    }

    const formattedShortfallRatio = percentFormatter.format(shortfall.shortfallRatio);

    return (
        <Text variant="body-sm" color="contentSecondary">
            <Translation
                id="moduleTrading.providerListItem.lessToReceiveThanRequested"
                values={{ percent: formattedShortfallRatio, amount: shortfall.formattedShortfall }}
            />
        </Text>
    );
};
