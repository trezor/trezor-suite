import { Row } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';
import { ExchangeTrade } from 'invity-api';
import { QuestionTooltip, Translation } from 'src/components/suite';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import {
    CoinmarketTradeDetailType,
    CoinmarketTradeExchangeType,
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
}

export const CoinmarketInfoExchangeType = ({ selectedQuote }: CoinmarketInfoExchangeTypeProps) => {
    const { exchangeInfo } = useCoinmarketFormContext<CoinmarketTradeExchangeType>();
    const exchangeQuote = selectedQuote as ExchangeTrade;

    const provider =
        exchangeInfo?.providerInfos && exchangeQuote.exchange
            ? exchangeInfo?.providerInfos[exchangeQuote.exchange]
            : undefined;

    return (
        <Row alignItems="center" justifyContent="center" flex={1}>
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
