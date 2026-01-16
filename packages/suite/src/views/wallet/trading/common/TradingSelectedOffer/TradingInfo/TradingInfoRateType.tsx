import { ExchangeTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import type { TradingTradeType } from '@suite-common/trading';
import { InfoItem, Text, Tooltip } from '@trezor/components';

import { TradingExchangeProvidersInfoProps } from 'src/types/trading/trading';

interface TradingInfoRateTypeProps {
    selectedQuote: TradingTradeType;
    providers: TradingExchangeProvidersInfoProps;
}

export const TradingInfoRateType = ({ selectedQuote, providers }: TradingInfoRateTypeProps) => {
    const exchangeQuote = selectedQuote as ExchangeTrade;

    const provider =
        providers && exchangeQuote.exchange ? providers[exchangeQuote.exchange] : undefined;
    const rateType = provider?.isFixedRate ? 'fixed' : 'floating';

    return (
        <InfoItem label={<Translation id="TR_TRADING_RATE" />} direction="row">
            <Text data-testid="@trading/offer/info/exchange-type">
                {rateType === 'fixed' && (
                    <Tooltip content={<Translation id="TR_EXCHANGE_FIXED_OFFERS_INFO" />} hasIcon>
                        <Translation id="TR_EXCHANGE_FIXED" />
                    </Tooltip>
                )}
                {rateType === 'floating' && (
                    <Tooltip content={<Translation id="TR_EXCHANGE_FLOAT_OFFERS_INFO" />} hasIcon>
                        <Translation id="TR_EXCHANGE_FLOAT" />
                    </Tooltip>
                )}
            </Text>
        </InfoItem>
    );
};
