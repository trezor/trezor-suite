import React from 'react';
import styled from 'styled-components';
import { BuyTrade } from 'invity-api';
import { useSelector } from '@suite-hooks';
import { Card, variables } from '@trezor/components';
import VerifyAddress from '../../../components/VerifyAddress';
import { CoinmarketBuyOfferInfo } from '@wallet-components';

const Wrapper = styled.div`
    display: flex;
    margin-top: 20px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex-direction: column;
    }
`;

const StyledCard = styled(Card)`
    flex: 1;
    padding: 0;
`;

interface Props {
    selectedQuote?: BuyTrade;
}

const SelectedOffer = ({ selectedQuote }: Props) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    if (selectedAccount.status !== 'loaded' || !selectedQuote) {
        return null;
    }
    const { account } = selectedAccount;

    return (
        <Wrapper>
            <StyledCard>
                <VerifyAddress selectedQuote={selectedQuote} />
            </StyledCard>
            <CoinmarketBuyOfferInfo selectedQuote={selectedQuote} account={account} />
        </Wrapper>
    );
};

export default SelectedOffer;
