import React from 'react';
import styled from 'styled-components';
import { ExchangeTrade } from 'invity-api';
import { Card, variables } from '@trezor/components';

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
    selectedQuote?: ExchangeTrade;
}

const SelectedOffer = ({ selectedQuote }: Props) => {
    if (!selectedQuote) {
        return null;
    }

    return (
        <Wrapper>
            <StyledCard>
                Selected offer here {/* <VerifyAddress selectedQuote={selectedQuote} /> */}
            </StyledCard>
            {/* <CoinmarketOfferInfo selectedQuote={selectedQuote} /> */}
        </Wrapper>
    );
};

export default SelectedOffer;
