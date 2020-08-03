import React, { Dispatch, SetStateAction } from 'react';
import styled from 'styled-components';
import { Quote, H2 } from '@trezor/components';
import { BuyTrade } from '@suite/services/invityAPI/buyTypes';

const Wrapper = styled.div``;

const Quotes = styled.div``;

const StyledQuote = styled(Quote)`
    margin-bottom: 20px;
`;

interface Props {
    selectQuote: Dispatch<SetStateAction<null>>;
    quotes: BuyTrade[];
}

const Offers = ({ selectQuote, quotes }: Props) => {
    return (
        <Wrapper>
            <H2>Offers:</H2>
            <Quotes>
                {quotes.map(quote => (
                    <StyledQuote
                        key={`${quote.exchange}-${quote.paymentMethod}-${quote.receiveCurrency}`}
                        exchange={quote.exchange}
                        receiveStringAmount={quote.receiveStringAmount}
                        receiveCurrency={quote.receiveCurrency}
                        paymentMethod={quote.paymentMethod}
                        selectQuote={selectQuote}
                    />
                ))}
            </Quotes>
        </Wrapper>
    );
};

export default Offers;
