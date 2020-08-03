import React from 'react';
import styled from 'styled-components';
import { BuyTrade } from '@suite/services/invityAPI/buyTypes';
import { useSelector } from '@suite-hooks';
import { Input, Card, Button } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
`;

const StyledCard = styled(Card)`
    flex: 1;
    justify-content: flex-start;
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

interface Props {
    selectedQuote: BuyTrade | null;
}

const SelectedOffer = ({ selectedQuote }: Props) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    if (selectedAccount.status !== 'loaded' || !selectedQuote) return null;
    const { account } = selectedAccount;

    return (
        <Wrapper>
            <StyledCard>
                <Input value={`Account # ${account.index + 1}`} />
                <Input value={account.descriptor} />
                <Button>Review and confirm</Button>
            </StyledCard>
            <Info>
                <Row>
                    <Left>spend</Left>
                    <Right>
                        `${selectedQuote.fiatStringAmount} ${selectedQuote.fiatCurrency}`
                    </Right>
                </Row>
                <Row>
                    <Left>buy</Left>
                    <Right>
                        `${selectedQuote.receiveStringAmount} ${selectedQuote.receiveCurrency}`
                    </Right>
                </Row>
                <Row>
                    <Left>provider</Left>
                    <Right>{selectedQuote.exchange}</Right>
                </Row>
                <Row>
                    <Left>paid by</Left>
                    <Right>{selectedQuote.paymentMethod}</Right>
                </Row>
            </Info>
        </Wrapper>
    );
};

export default SelectedOffer;
