import React from 'react';
import styled from 'styled-components';
import { colors, variables, Icon, CoinLogo } from '@trezor/components';
import { PaymentType, ProviderInfo } from '@wallet-components';
import { useSelector } from '@suite-hooks';
import { Trade } from '@wallet-reducers/coinmarketReducer';
import { formatDistance } from 'date-fns';

import Status from '../components/Status';

interface Props {
    trade: Trade;
}

const Transaction = ({ trade }: Props) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    if (selectedAccount.status !== 'loaded') {
        return null;
    }

    if (trade.tradeType !== 'buy') return null;

    const {
        account: { symbol },
    } = selectedAccount;
    const { date, data } = trade;
    const {
        fiatStringAmount,
        fiatCurrency,
        status,
        receiveStringAmount,
        exchange,
        paymentMethod,
        receiveCurrency,
    } = data;

    return (
        <Wrapper>
            <Column>
                <Row>
                    <Amount>
                        {fiatStringAmount} {fiatCurrency}
                    </Amount>
                    <Arrow>
                        <Icon color={colors.NEUE_TYPE_LIGHT_GREY} size={13} icon="ARROW_RIGHT" />
                    </Arrow>
                    {receiveStringAmount} {receiveCurrency}
                    {/* TODO FIX THIS LOGO */}
                    <StyledCoinLogo size={13} symbol={symbol} />
                </Row>
                <SmallRow>
                    {trade.tradeType.toUpperCase()} • {formatDistance(new Date(date), new Date())}{' '}
                    ago • <StyledStatus status={status} />
                </SmallRow>
            </Column>
            <Column>
                <Row>
                    <ProviderInfo exchange={exchange} />
                </Row>
                <RowSecond>
                    <PaymentType method={paymentMethod} />
                </RowSecond>
            </Column>
            <BuyColumn>Buy Again</BuyColumn>
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

const StyledStatus = styled(Status)`
    margin-left: 5px;
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

const Amount = styled.div``;

const StyledCoinLogo = styled(CoinLogo)`
    display: flex;
    padding: 0 0 0 5px;
    height: 100%;
`;

const Arrow = styled.div`
    display: flex;
    align-items: center;
    padding: 0 11px;
`;

export default Transaction;
