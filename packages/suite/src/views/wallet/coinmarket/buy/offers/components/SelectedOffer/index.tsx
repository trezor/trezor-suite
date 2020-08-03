import React from 'react';
import styled from 'styled-components';
import { BuyTrade } from '@suite/services/invityAPI/buyTypes';

const Wrapper = styled.div``;

interface Props {
    selectedQuote: BuyTrade | null;
}

const SelectedOffer = ({ selectedQuote }: Props) => {
    return <Wrapper>{console.log('selectedOffer', selectedQuote)} aaaaaaaaaaa</Wrapper>;
};

export default SelectedOffer;
