import { Translation, type TranslationKey } from '@suite/intl';
import { type TradingTypeWithConcierge } from '@suite-common/trading';

import { useMessageSystemTrading } from '#src/hooks/suite/useMessageSystemTrading';

import { TradingUnavailableCard } from './TradingUnavailableCard';

const typeTitles: Record<TradingTypeWithConcierge, TranslationKey> = {
    buy: 'TR_TRADING_DISABLED_TITLE_BUY',
    sell: 'TR_TRADING_DISABLED_TITLE_SELL',
    exchange: 'TR_TRADING_DISABLED_TITLE_EXCHANGE',
    concierge: 'TR_TRADING_DISABLED_TITLE_CONCIERGE',
};

const typeDescriptions: Record<TradingTypeWithConcierge, TranslationKey> = {
    buy: 'TR_TRADING_DISABLED_DESCRIPTION_BUY',
    sell: 'TR_TRADING_DISABLED_DESCRIPTION_SELL',
    exchange: 'TR_TRADING_DISABLED_DESCRIPTION_EXCHANGE',
    concierge: 'TR_TRADING_DISABLED_DESCRIPTION_CONCIERGE',
};

type TradingTypeDisabledProps = {
    type: TradingTypeWithConcierge;
};

export const TradingTypeDisabled = ({ type }: TradingTypeDisabledProps) => {
    const { content } = useMessageSystemTrading(type);

    return (
        <TradingUnavailableCard
            data-testid="@trading/type-disabled"
            title={<Translation id={typeTitles[type]} />}
            description={content ?? <Translation id={typeDescriptions[type]} />}
        />
    );
};
