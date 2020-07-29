import React from 'react';
import styled from 'styled-components';
import { colors, Button } from '../../../index';

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
`;

const Tag = styled.div`
    margin-top: 10px;
    margin-left: -20px;
    border: 1px solid tan;
    text-transform: uppercase;
`;

const Main = styled.div`
    display: flex;
    padding: 10px 20px;
    justify-content: space-between;
`;

const Left = styled.div`
    display: flex;
`;

const Right = styled.div`
    display: flex;
    justify-content: flex-end;
`;

const Details = styled.div`
    display: flex;
    padding: 10px 20px;
`;

interface Props {
    className?: string;
    getOffer?: () => void;
    amount?: string;
}

const Offer = ({ className, getOffer, amount }: Props) => (
    <Wrapper className={className}>
        <TagRow>
            <Tag>best offer</Tag>
        </TagRow>
        <Main>
            <Left>{amount}</Left>
            <Right>
                <Button onClick={getOffer}>Get this offer</Button>
            </Right>
        </Main>
        <Details>aa</Details>
    </Wrapper>
);

export { Offer, Props as OfferProps };
