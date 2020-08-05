import React from 'react';
import styled from 'styled-components';
import { BuyTrade } from '@suite/services/invityAPI/buyTypes';
import { colors, variables, CoinLogo } from '@trezor/components';
import { useSelector } from '@suite-hooks';
import TransactionId from '../TransactionId';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Info = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 350px;
    margin: 0 0 10px 30px;
    min-height: 200px;
    border: 1px solid ${colors.NEUE_STROKE_GREY};
    border-radius: 4px;
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
    margin-bottom: 5px;
    min-height: 50px;
    padding: 0 24px;
`;

const AccountText = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.NEUE_TYPE_DARK_GREY};
    padding-left: 7px;
`;

const LeftColumn = styled.div`
    display: flex;
    flex: 1;
    text-transform: uppercase;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

const RightColumn = styled.div`
    display: flex;
    justify-content: flex-end;
    flex: 1;
`;

const Row = styled.div`
    display: flex;
    margin: 5px 24px;
`;

const Dark = styled.div`
    display: flex;
    justify-content: flex-end;
    flex: 1;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${colors.NEUE_TYPE_DARK_GREY};
`;

const RowWithBorder = styled(Row)`
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
    margin-bottom: 10px;
    padding-bottom: 10px;
`;

const StyledTransactionId = styled(TransactionId)`
    margin: 0 0 10px 30px;
`;

interface Props {
    selectedQuote?: BuyTrade;
}

const OfferInfo = ({ selectedQuote }: Props) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    if (selectedAccount.status !== 'loaded' || !selectedQuote) {
        return null;
    }
    const { account } = selectedAccount;
    const { receiveStringAmount, receiveCurrency, exchange, paymentMethod } = selectedQuote;

    return (
        <Wrapper>
            <Info>
                <Header>
                    <CoinLogo symbol={account.symbol} size={16} />
                    <AccountText>{`Account #${account.index + 1}`}</AccountText>
                </Header>
                <Row>
                    <LeftColumn>spend</LeftColumn>
                    <RightColumn>
                        <Dark>xxxxx</Dark>
                    </RightColumn>
                </Row>
                <RowWithBorder>
                    <LeftColumn>buy</LeftColumn>
                    <RightColumn>
                        <Dark>{`${receiveStringAmount} ${receiveCurrency}`}</Dark>
                    </RightColumn>
                </RowWithBorder>
                <Row>
                    <LeftColumn>provider</LeftColumn>
                    <RightColumn>{exchange}</RightColumn>
                </Row>
                <Row>
                    <LeftColumn>paid by</LeftColumn>
                    <RightColumn>{paymentMethod}</RightColumn>
                </Row>
            </Info>
            <StyledTransactionId transactionId="dbd35574-aa74-49ba-b318-e3c16dbee1d7" />
        </Wrapper>
    );
};

export default OfferInfo;
