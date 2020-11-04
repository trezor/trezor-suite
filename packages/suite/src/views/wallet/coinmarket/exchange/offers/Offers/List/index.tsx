import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import Quote from './Quote';
import { ExchangeTrade } from 'invity-api';
import { QuestionTooltip, Translation } from '@suite-components';
import { useCoinmarketExchangeOffersContext } from '@wallet-hooks/useCoinmarketExchangeOffers';

const Wrapper = styled.div``;
const Quotes = styled.div``;

const StyledQuote = styled(Quote)`
    margin-bottom: 20px;
`;

const SummaryRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    padding: 10px 0;
`;

const Divider = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    cursor: default;
    padding: 10px 0;
`;

const DividerLine = styled.div`
    height: 1px;
    flex: 1;
    background: ${props => props.theme.STROKE_GREY};
`;

const Left = styled.div`
    display: flex;
`;

const Right = styled.div`
    display: flex;
    justify-self: flex-end;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledQuestionTooltip = styled(QuestionTooltip)`
    padding-left: 4px;
    padding-top: 1px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const RatesRow = styled.div`
    margin: 10px 0;
    display: flex;
    align-items: center;
`;

interface Props {
    quotes?: ExchangeTrade[];
    isFixed?: boolean;
}

const List = ({ quotes, isFixed }: Props) => {
    const { quotesRequest } = useCoinmarketExchangeOffersContext();
    if (!quotesRequest || !quotes) return null;

    return (
        <Wrapper>
            <Divider>
                <DividerLine />
            </Divider>
            <SummaryRow>
                <Left>
                    {isFixed ? (
                        <RatesRow>
                            <Translation id="TR_EXCHANGE_FIXED_OFFERS" />
                            <StyledQuestionTooltip tooltip="TR_EXCHANGE_FIXED_OFFERS_INFO" />
                        </RatesRow>
                    ) : (
                        <RatesRow>
                            <Translation id="TR_EXCHANGE_FLOAT_OFFERS" />
                            <StyledQuestionTooltip tooltip="TR_EXCHANGE_FLOAT_OFFERS_INFO" />
                        </RatesRow>
                    )}
                </Left>
                <Right>
                    <Translation id="TR_EXCHANGE_FEES_INCLUDED" />
                    <StyledQuestionTooltip tooltip="TR_EXCHANGE_FEES_INCLUDED_INFO" />
                </Right>
            </SummaryRow>
            <Quotes>
                {quotes.map(quote => (
                    <StyledQuote key={`${quote.exchange}`} quote={quote} />
                ))}
            </Quotes>
        </Wrapper>
    );
};

export default List;
