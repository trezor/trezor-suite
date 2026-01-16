import { ExchangeTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import type { TradingTradeType } from '@suite-common/trading';
import { InfoItem, Text, Tooltip } from '@trezor/components';

import { TradingExchangeProvidersInfoProps } from 'src/types/trading/trading';

interface TradingInfoExchangeTypeProps {
    selectedQuote: TradingTradeType;
    providers: TradingExchangeProvidersInfoProps;
}

export const TradingInfoExchangeType = ({ selectedQuote }: TradingInfoExchangeTypeProps) => {
    const exchangeQuote = selectedQuote as ExchangeTrade;

    return (
        <InfoItem label={<Translation id="TR_TRADING_EXCHANGE_TYPE" />} direction="row">
            <Text>
                {exchangeQuote.isDex ? (
                    <Tooltip
                        content={<Translation id="TR_EXCHANGE_DECENTRALIZED_EXCHANGE" />}
                        hasIcon
                    >
                        <Translation id="TR_EXCHANGE_DEX" />
                    </Tooltip>
                ) : (
                    <Tooltip
                        content={<Translation id="TR_EXCHANGE_CENTRALIZED_EXCHANGE" />}
                        hasIcon
                    >
                        <Translation id="TR_EXCHANGE_CEX" />
                    </Tooltip>
                )}
            </Text>
        </InfoItem>
    );
};
