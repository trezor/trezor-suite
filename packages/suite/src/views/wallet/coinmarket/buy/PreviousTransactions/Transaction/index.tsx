import React from 'react';
import styled from 'styled-components';
import { colors, variables, Icon, CoinLogo } from '@trezor/components';
import { BuyTrade } from 'invity-api';
import { PaymentType, ProviderInfo } from '@wallet-components';
import { useSelector } from '@suite-hooks';

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

const Row = styled.div`
    display: flex;
    align-items: center;
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StatusRow = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const Amount = styled.div``;

const StyledCoinLogo = styled(CoinLogo)`
    display: flex;
    padding: 3px 5px 0 0;
    height: 100%;
`;

const Arrow = styled.div`
    padding: 0 11px;
`;

interface Props {
    transaction: BuyTrade;
}

const Transaction = ({ transaction }: Props) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    if (selectedAccount.status !== 'loaded') {
        return null;
    }

    const {
        account: { symbol },
    } = selectedAccount;

    const {
        fiatStringAmount,
        fiatCurrency,
        status,
        exchange,
        paymentMethod,
        receiveCurrency,
    } = transaction;

    return (
        <Wrapper>
            <Column>
                <Row>
                    <Amount>
                        {fiatStringAmount} {fiatCurrency}
                    </Amount>
                    <Arrow>
                        <Icon size={13} icon="ARROW_RIGHT" />
                    </Arrow>
                    {/* TODO FIX THIS LOGO */}
                    <StyledCoinLogo size={13} symbol={symbol} /> {receiveCurrency}
                </Row>
                <StatusRow>{status}</StatusRow>
            </Column>
            <Column>
                <Row>
                    <ProviderInfo exchange={exchange} />
                </Row>
                <Row>
                    <PaymentType method={paymentMethod} />
                </Row>
            </Column>
            <BuyColumn>Buy Again</BuyColumn>
        </Wrapper>
    );
};

export default Transaction;
