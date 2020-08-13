import React from 'react';
import styled from 'styled-components';
import { colors, Button, variables } from '@trezor/components';
import { PaymentType, ProviderInfo } from '@wallet-components';
import { QuestionTooltip } from '@suite-components';
import { BuyTrade } from 'invity-api';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    border-radius: 6px;
    flex: 1;
    width: 100%;
    min-height: 150px;
    background: ${colors.WHITE};
`;

const TagRow = styled.div`
    display: flex;
    min-height: 30px;
`;

const Tag = styled.div`
    margin-top: 10px;
    height: 35px;
    margin-left: -20px;
    border: 1px solid tan;
    text-transform: uppercase;
`;

const Main = styled.div`
    display: flex;
    margin: 0 30px;
    justify-content: space-between;
    padding-bottom: 20px;
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
`;

const Left = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.H2};
`;

const Right = styled.div`
    display: flex;
    justify-content: flex-end;
`;

const Details = styled.div`
    display: flex;
    min-height: 20px;
    flex-wrap: wrap;
    padding: 10px 30px;
`;

const Column = styled.div`
    display: flex;
    padding: 10px 0;
    flex: 1;
    flex-direction: column;
    justify-content: flex-start;
`;

const Heading = styled.div`
    display: flex;
    text-transform: uppercase;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    padding-bottom: 9px;
`;

const StyledButton = styled(Button)`
    width: 180px;
`;

const Value = styled.div`
    display: flex;
    align-items: center;
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Footer = styled.div`
    margin: 0 30px;
    padding: 10px 0;
    padding-top: 23px;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    border-top: 1px solid ${colors.NEUE_STROKE_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const ErrorFooter = styled.div`
    margin: 0 30px;
    padding: 10px 0;
    border-top: 1px solid ${colors.NEUE_STROKE_GREY};
    color: ${colors.RED_ERROR};
`;

interface Props {
    className?: string;
    selectQuote: (quote: BuyTrade) => void;
    quote: BuyTrade;
}

const StyledQuestionTooltip = styled(QuestionTooltip)`
    padding-left: 4px;
    padding-top: 1px;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

const Quote = ({ className, selectQuote, quote }: Props) => {
    const hasTag = false; // TODO - tags are in quote.tags, will need some algorithm to evaluate them and show only one
    const { receiveStringAmount, receiveCurrency, paymentMethod, exchange } = quote;

    return (
        <Wrapper className={className}>
            <TagRow>{hasTag && <Tag>best offer</Tag>}</TagRow>
            <Main>
                <Left>{quote.error ? 'N/A' : `${receiveStringAmount} ${receiveCurrency}`}</Left>
                <Right>
                    <StyledButton onClick={() => selectQuote(quote)}>Get this Offer</StyledButton>
                </Right>
            </Main>
            <Details>
                <Column>
                    <Heading>Provider</Heading>
                    <Value>
                        <ProviderInfo exchange={exchange} />
                    </Value>
                </Column>
                <Column>
                    <Heading>Paid by</Heading>
                    <Value>
                        <PaymentType method={paymentMethod} />
                    </Value>
                </Column>
                <Column>
                    <Heading>
                        Fees <StyledQuestionTooltip messageId="TR_OFFER_FEE_INFO" />
                    </Heading>
                    <Value>All fee included</Value>
                </Column>
            </Details>
            {quote.error && <ErrorFooter>{quote.error}</ErrorFooter>}
            {quote.infoNote && !quote.error && <Footer>{quote.infoNote}</Footer>}
        </Wrapper>
    );
};

export default Quote;
