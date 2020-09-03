import React from 'react';
import styled from 'styled-components';
import { colors } from '@trezor/components';
import Quote from './Quote';
import { ExchangeTrade } from 'invity-api';
import { useSelector } from '@suite/hooks/suite';
import { QuestionTooltip, Translation } from '@suite-components';

const Wrapper = styled.div``;
const Quotes = styled.div``;

const StyledQuote = styled(Quote)`
    margin-bottom: 20px;
`;

const SummaryRow = styled.div`
    display: flex;
    align-items: center;
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
    background: ${colors.NEUE_STROKE_GREY};
`;

const Left = styled.div`
    display: flex;
`;

const Right = styled.div`
    display: flex;
    justify-self: flex-end;
`;

const StyledQuestionTooltip = styled(QuestionTooltip)`
    padding-left: 4px;
    padding-top: 1px;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

interface Props {
    selectQuote: (quote: ExchangeTrade) => void;
    quotes?: ExchangeTrade[];
    isFixed?: boolean;
}

const Offers = ({ selectQuote, quotes, isFixed }: Props) => {
    const quotesRequest = useSelector(state => state.wallet.coinmarket.exchange.quotesRequest);
    if (!quotesRequest || !quotes) return null;

    return (
        <Wrapper>
            <Divider>
                <DividerLine />
            </Divider>
            <SummaryRow>
                <Left>
                    {isFixed ? (
                        <>
                            <Translation id="TR_EXCHANGE_FIXED_OFFERS" />
                            <StyledQuestionTooltip messageId="TR_EXCHANGE_FIXED_OFFERS_INFO" />
                        </>
                    ) : (
                        <>
                            <Translation id="TR_EXCHANGE_FLOAT_OFFERS" />
                            <StyledQuestionTooltip messageId="TR_EXCHANGE_FLOAT_OFFERS_INFO" />
                        </>
                    )}
                </Left>
                <Right>
                    <Translation id="TR_EXCHANGE_FEES_INCLUDED" />
                    <StyledQuestionTooltip messageId="TR_EXCHANGE_FEES_INCLUDED_INFO" />
                </Right>
            </SummaryRow>
            <Quotes>
                {quotes.map(quote => (
                    <StyledQuote
                        key={`${quote.exchange}`}
                        quote={quote}
                        selectQuote={selectQuote}
                    />
                ))}
            </Quotes>
        </Wrapper>
    );
};

export default Offers;
