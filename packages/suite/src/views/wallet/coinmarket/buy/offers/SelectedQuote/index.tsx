import React from 'react';
import styled from 'styled-components';
import { BuyTrade } from '@suite/services/invityAPI/buyTypes';
import { getAccountInfo } from '@wallet-utils/coinmarket/buyUtils';
import { FiatValue } from '@suite-components';
import * as coinmarketActions from '@wallet-actions/coinmarketActions';
import { useActions, useSelector } from '@suite-hooks';
import { Input, Card, Button, colors, variables, CoinLogo } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    margin-top: 20px;
`;

const StyledCard = styled(Card)`
    flex: 1;
    justify-content: flex-start;
    padding: 0;
`;

const CardContent = styled.div`
    padding: 24px;
`;

const Info = styled.div`
    min-width: 350px;
    padding-left: 20px;
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    text-transform: uppercase;
`;

const Right = styled.div`
    display: flex;
    justify-content: flex-end;
    flex: 1;
`;

const Row = styled.div`
    display: flex;
`;

const LogoWrapper = styled.div`
    display: flex;
    align-items: center;
    padding: 0 0 0 10px;
`;

const AccountWrapper = styled.div`
    display: flex;
    padding: 0 0 0 10px;
    flex-direction: column;
`;

const Label = styled.div`
    display: flex;
    padding-bottom: 10px;
`;

const Amount = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
`;

const AccountName = styled.div`
    display: flex;
`;

const FakeInput = styled.div`
    display: flex;
    margin-bottom: 20px;
    padding: 5px;
    align-items: center;
    border-radius: 4px;
    border: solid 2px ${colors.NEUE_STROKE_GREY};
    background: ${colors.WHITE};
`;

const ButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 20px;
    border-top: 1px solid ${colors.NEUE_STROKE_GREY};
    margin: 20px 0;
`;

const Confirmed = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
`;

interface Props {
    selectedQuote: BuyTrade | null;
}

const SelectedOffer = ({ selectedQuote }: Props) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const addressVerified = useSelector(state => state.wallet.coinmarket.addressVerified);
    const { verifyAddress } = useActions({ verifyAddress: coinmarketActions.verifyAddress });
    if (selectedAccount.status !== 'loaded' || !selectedQuote) return null;
    const { account } = selectedAccount;
    const { symbol, index, availableBalance } = account;
    const {
        fiatStringAmount,
        fiatCurrency,
        receiveStringAmount,
        receiveCurrency,
        exchange,
        paymentMethod,
    } = selectedQuote;

    const { path, address } = getAccountInfo(account);

    if (!path || !address) {
        console.log('handle error');
        return null;
    }

    return (
        <Wrapper>
            <StyledCard>
                <CardContent>
                    <Label>Receiving account</Label>
                    <FakeInput>
                        <LogoWrapper>
                            <CoinLogo size={25} symbol={symbol} />
                        </LogoWrapper>
                        <AccountWrapper>
                            <AccountName>Account #{index + 1}</AccountName>
                            <Amount>
                                {availableBalance} {symbol} •
                                <FiatValue amount={availableBalance} symbol={symbol} />
                            </Amount>
                        </AccountWrapper>
                    </FakeInput>
                    <Input label="Receive address" value={address} />
                </CardContent>
                {addressVerified && <Confirmed>Confirmed on trezor</Confirmed>}
                <ButtonWrapper>
                    {!addressVerified && (
                        <Button onClick={() => verifyAddress(path, address)}>
                            Review &amp; confirm
                        </Button>
                    )}
                    {addressVerified && <Button onClick={() => {}}>Go to payment</Button>}
                </ButtonWrapper>
            </StyledCard>
            <Info>
                <Row>
                    <Left>spend</Left>
                    <Right>{`${fiatStringAmount} ${fiatCurrency}`}</Right>
                </Row>
                <Row>
                    <Left>buy</Left>
                    <Right>{`${receiveStringAmount} ${receiveCurrency}`}</Right>
                </Row>
                <Row>
                    <Left>provider</Left>
                    <Right>{exchange}</Right>
                </Row>
                <Row>
                    <Left>paid by</Left>
                    <Right>{paymentMethod}</Right>
                </Row>
            </Info>
        </Wrapper>
    );
};

export default SelectedOffer;
