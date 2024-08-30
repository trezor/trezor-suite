import { Row } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';
import { ExchangeTrade } from 'invity-api';
import { QuestionTooltip, Translation } from 'src/components/suite';
import {
    CoinmarketExchangeProvidersInfoProps,
    CoinmarketTradeDetailType,
} from 'src/types/coinmarket/coinmarket';
import styled from 'styled-components';

const QuestionTooltipWrapper = styled.div`
    padding-left: ${spacingsPx.xxs};
`;

const Text = styled.div`
    ${typography.body}
    color: ${({ theme }) => theme.textSubdued};
`;

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
        <Row alignItems="center" justifyContent="center" flex="auto">
            <Text>
                {provider?.isFixedRate && !exchangeQuote.isDex && (
                    <>
                        <Translation id="TR_EXCHANGE_FIXED" />
                        <QuestionTooltipWrapper>
                            <QuestionTooltip tooltip="TR_EXCHANGE_FIXED_OFFERS_INFO" />
                        </QuestionTooltipWrapper>
                    </>
                )}
                {!provider?.isFixedRate && !exchangeQuote.isDex && (
                    <>
                        <Translation id="TR_EXCHANGE_FLOAT" />
                        <QuestionTooltipWrapper>
                            <QuestionTooltip tooltip="TR_EXCHANGE_FLOAT_OFFERS_INFO" />
                        </QuestionTooltipWrapper>
                    </>
                )}
                {exchangeQuote.isDex && <Translation id="TR_EXCHANGE_DEX" />}
            </Text>
        </Row>
    );
};
