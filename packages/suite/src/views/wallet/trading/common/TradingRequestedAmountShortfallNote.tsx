import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import {
    type TradingTradeType,
    useTradingFormattedRequestedAmountShortfall,
} from '@suite-common/trading';
import { localizePercentage } from '@suite-common/wallet-utils';
import { Text } from '@trezor/components';

type TradingRequestedAmountShortfallNoteProps = {
    quote: TradingTradeType;
};

export const TradingRequestedAmountShortfallNote = ({
    quote,
}: TradingRequestedAmountShortfallNoteProps) => {
    const language = useSelector(selectLanguage);
    const shortfall = useTradingFormattedRequestedAmountShortfall({ quote });

    if (!shortfall) {
        return null;
    }

    const formattedShortfallRatio = localizePercentage({
        valueInFraction: shortfall.shortfallRatio,
        locale: language,
    });

    return (
        <Text
            typographyStyle="body-sm"
            intent="neutral"
            priority="secondary"
            data-testid="@trading/quote/shortfall-note"
        >
            <Translation
                id="TR_TRADING_LESS_TO_RECEIVE_THAN_REQUESTED"
                values={{ percent: formattedShortfallRatio, amount: shortfall.formattedShortfall }}
            />
        </Text>
    );
};
