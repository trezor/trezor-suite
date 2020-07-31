import React from 'react';
import styled from 'styled-components';
import { colors, Button, variables } from '../../../index';

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
    margin-left: -20px;
    border: 1px solid tan;
    text-transform: uppercase;
`;

const Main = styled.div`
    display: flex;
    margin: 10px 30px;
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
    text-transform: uppercase;
`;

const Value = styled.div``;

const Footer = styled.div`
    padding: 10px 0;
    border-top: 1px solid ${colors.NEUE_STROKE_GREY};
`;

interface Props {
    className?: string;
    getOffer?: () => void;
    exchange: string;
    receiveStringAmount: string;
    receiveCurrency: string;
    paymentMethod: string;
    hasTag?: boolean;
}

const Offer = ({
    className,
    getOffer,
    exchange,
    receiveStringAmount,
    receiveCurrency,
    paymentMethod,
    hasTag = false,
}: Props) => (
    <Wrapper className={className}>
        <TagRow>{hasTag && <Tag>best offer</Tag>}</TagRow>
        <Main>
            <Left>
                {receiveStringAmount} {receiveCurrency}
            </Left>
            <Right>
                <Button onClick={getOffer}>Get this offer</Button>
            </Right>
        </Main>
        <Details>
            <Column>
                <Heading>Provider</Heading>
                <Value>{exchange}</Value>
            </Column>
            <Column>
                <Heading>Paid by</Heading>
                <Value>{paymentMethod}</Value>
            </Column>
            <Column>
                <Heading>Fees</Heading>
                <Value>All fee included</Value>
            </Column>
            <Column>
                <Heading>KYC</Heading>
                <Value>Yes</Value>
            </Column>
            <Footer>
                In publishing and graphic design, lorem ipsum is common placeholder text used to
                demonstrate the graphic elements of a document or visual presentation, such as web
                pages, typography, and graphical layout. It is a form of "greeking".
            </Footer>
        </Details>
    </Wrapper>
);

export { Offer, Props as OfferProps };
