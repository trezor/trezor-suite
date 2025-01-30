import { ExchangeTrade } from 'invity-api';

import type { TradingTradeType } from '@suite-common/trading';
import { Row, Text, Tooltip } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { TradingExchangeProvidersInfoProps } from 'src/types/trading/trading';

interface TradingInfoExchangeTypeProps {
    selectedQuote: TradingTradeType;
    providers: TradingExchangeProvidersInfoProps;
}

export const TradingInfoExchangeType = ({
    selectedQuote,
    providers,
}: TradingInfoExchangeTypeProps) => {
    const exchangeQuote = selectedQuote as ExchangeTrade;

    const provider =
        providers && exchangeQuote.exchange ? providers[exchangeQuote.exchange] : undefined;

    return (
        <Row justifyContent="center" flex="auto">
            <Text variant="tertiary">
                {provider?.isFixedRate && !exchangeQuote.isDex && (
                    <Tooltip content={<Translation id="TR_EXCHANGE_FIXED_OFFERS_INFO" />} hasIcon>
                        <Translation id="TR_EXCHANGE_FIXED" />
                    </Tooltip>
                )}
                {!provider?.isFixedRate && !exchangeQuote.isDex && (
                    <Tooltip content={<Translation id="TR_EXCHANGE_FLOAT_OFFERS_INFO" />} hasIcon>
                        <Translation id="TR_EXCHANGE_FLOAT" />
                    </Tooltip>
                )}
                {exchangeQuote.isDex && <Translation id="TR_EXCHANGE_DEX" />}
            </Text>
        </Row>
    );
};
