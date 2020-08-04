import React, { Dispatch, SetStateAction } from 'react';
import styled from 'styled-components';
import { Quote, CoinLogo } from '@trezor/components';
import { BuyTrade } from '@suite/services/invityAPI/buyTypes';
import { useSelector } from '@suite-hooks';

const Wrapper = styled.div``;

const Quotes = styled.div``;

const StyledQuote = styled(Quote)`
    margin-bottom: 20px;
`;

const Header = styled.div`
    min-height: 50px;
    display: flex;
    align-items: center;
`;

interface Props {
    selectQuote: Dispatch<SetStateAction<null>>;
    quotes: BuyTrade[];
}

const Offers = ({ selectQuote, quotes }: Props) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const quotesRequest = useSelector(state => state.wallet.coinmarket.quotesRequest);
    if (!quotesRequest) return null;

    if (selectedAccount.status !== 'loaded') return null;
    const { account } = selectedAccount;
    const { fiatStringAmount, fiatCurrency } = quotesRequest;

    return (
        <Wrapper>
            <Header>
                {fiatStringAmount} {fiatCurrency} {'->'}
                <CoinLogo size={16} symbol={account.symbol} /> {account.symbol}
            </Header>
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
