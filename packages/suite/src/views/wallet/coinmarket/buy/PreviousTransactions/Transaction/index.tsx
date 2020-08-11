import React from 'react';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components';
import { BuyTrade } from 'invity-api';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    margin-bottom: 20px;
    border: 1px solid ${colors.NEUE_STROKE_GREY};
    min-height: 81px;
    border-radius: 4px;
    padding: 12px 0;

    &:hover {
        background: ${colors.WHITE};
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
        cursor: pointer;
    }
`;

const Column = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 17px 24px;
`;

const BuyColumn = styled(Column)`
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    max-width: 130px;
    border-left: 1px solid ${colors.NEUE_STROKE_GREY};
`;

const Row = styled.div``;

interface Props {
    transaction: BuyTrade;
}

const Transaction = ({ transaction }: Props) => {
    const { fiatStringAmount, fiatCurrency, status, exchange, paymentMethod } = transaction;

    return (
        <Wrapper>
            <Column>
                <Row>
                    {fiatStringAmount} {fiatCurrency}
                </Row>
                <Row>{status}</Row>
            </Column>
            <Column>
                <Row>{exchange}</Row>
                <Row>{paymentMethod}</Row>
            </Column>
            <BuyColumn>Buy Again</BuyColumn>
        </Wrapper>
    );
};

export default Transaction;
