import React from 'react';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components';
import { CoinmarketPaymentType, CoinmarketExchangeProviderInfo } from '@wallet-components';
import { TradeExchange } from '@wallet-reducers/coinmarketReducer';
import { formatDistance } from 'date-fns';

interface Props {
    trade: TradeExchange;
}

const ExchangeTransaction = ({ trade }: Props) => {
    const { date, data } = trade;
    const { receiveStringAmount, exchange, paymentMethod, receiveCurrency } = data;

    return (
        <Wrapper>
            <Column>
                <Row>
                    {receiveStringAmount} {receiveCurrency}
                </Row>
                <SmallRow>
                    {trade.tradeType.toUpperCase()} • {formatDistance(new Date(date), new Date())}{' '}
                    ago •
                </SmallRow>
            </Column>
            <Column>
                <Row>
                    <CoinmarketExchangeProviderInfo exchange={exchange} />
                </Row>
                <RowSecond>
                    <CoinmarketPaymentType method={paymentMethod} />
                </RowSecond>
            </Column>
        </Wrapper>
    );
};

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    margin-bottom: 20px;
    border: 1px solid ${colors.NEUE_STROKE_GREY};
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

const Row = styled.div`
    display: flex;
    align-items: center;
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const RowSecond = styled(Row)`
    padding-top: 8px;
`;

const SmallRow = styled.div`
    padding-top: 8px;
    display: flex;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.TINY};
`;

export default ExchangeTransaction;
