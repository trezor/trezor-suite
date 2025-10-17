import { ExchangeTrade } from 'invity-api';

import type { TradingTradeType } from '@suite-common/trading';
import { InfoItem, Text, Tooltip } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';
import { TradingExchangeProvidersInfoProps } from 'src/types/trading/trading';

interface TradingInfoExchangeTypeProps {
    selectedQuote: TradingTradeType;
    providers: TradingExchangeProvidersInfoProps;
}

export const TradingInfoExchangeType = ({ selectedQuote }: TradingInfoExchangeTypeProps) => {
    const exchangeQuote = selectedQuote as ExchangeTrade;

    return (
        <InfoItem label={<Translation id="TR_TRADING_EXCHANGE_TYPE" />} direction="row">
            <Text typographyStyle="hint">
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
