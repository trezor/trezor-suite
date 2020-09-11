import React from 'react';
import styled from 'styled-components';
import { Card, variables } from '@trezor/components';
import VerifyAddress from './components/VerifyAddress';
import { CoinmarketBuyOfferInfo } from '@wallet-components';
import { useCoinmarketOffersContext } from '@wallet-hooks/useCoinmarketOffers';

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

const SelectedOffer = () => {
    const { account, selectedQuote } = useCoinmarketOffersContext();
    if (!selectedQuote) return null;

    return (
        <Wrapper>
            <StyledCard>
                <VerifyAddress />
            </StyledCard>
            <CoinmarketBuyOfferInfo selectedQuote={selectedQuote} account={account} />
        </Wrapper>
    );
};

export default SelectedOffer;
