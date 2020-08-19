import React from 'react';
import styled from 'styled-components';
import { BuyTrade } from 'invity-api';
import { Card, variables } from '@trezor/components';
import VerifyAddress from '../../../components/VerifyAddress';
import OfferInfo from '../../../components/OfferInfo';

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
    if (!selectedQuote) {
        return null;
    }

    return (
        <Wrapper>
            <StyledCard>
                <VerifyAddress selectedQuote={selectedQuote} />
            </StyledCard>
            <OfferInfo selectedQuote={selectedQuote} />
        </Wrapper>
    );
};

export default SelectedOffer;
