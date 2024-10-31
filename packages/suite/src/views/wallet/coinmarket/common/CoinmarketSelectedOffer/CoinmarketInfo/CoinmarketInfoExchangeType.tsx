import { Row, Tooltip, Text } from '@trezor/components';
import { ExchangeTrade } from 'invity-api';
import { Translation } from 'src/components/suite';
import {
    CoinmarketExchangeProvidersInfoProps,
    CoinmarketTradeDetailType,
} from 'src/types/coinmarket/coinmarket';

interface CoinmarketInfoExchangeTypeProps {
    selectedQuote: CoinmarketTradeDetailType;
    providers: CoinmarketExchangeProvidersInfoProps;
}

export const CoinmarketInfoExchangeType = ({
    selectedQuote,
    providers,
}: CoinmarketInfoExchangeTypeProps) => {
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
