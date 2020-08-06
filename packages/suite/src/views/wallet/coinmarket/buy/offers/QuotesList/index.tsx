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
    margin: 15px 0;
`;

const SummaryRow = styled.div`
    min-height: 30px;
    display: flex;
    align-items: center;
`;

const OrigAmount = styled.div`
    color: #808080;
    font-size: smaller;
`;

interface Props {
    selectQuote: Dispatch<SetStateAction<undefined>>;
    quotes?: BuyTrade[];
    isAlternative?: boolean;
}

const Offers = ({ selectQuote, quotes, isAlternative }: Props) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const quotesRequest = useSelector(state => state.wallet.coinmarket.quotesRequest);
    const providers = useSelector(state => state.wallet.coinmarket.buyInfo?.providerInfos);
    if (!quotesRequest || !quotes) return null;

    if (selectedAccount.status !== 'loaded') return null;
    const { account } = selectedAccount;
    const { fiatStringAmount, fiatCurrency } = quotesRequest;

    return (
        <Wrapper>
            {isAlternative ? (
                <>
                    <Header>
                        <SummaryRow>
                            {quotes[0].fiatStringAmount} {quotes[0].fiatCurrency} {'->'}
                            <CoinLogo size={16} symbol={account.symbol} /> {account.symbol}
                        </SummaryRow>
                        <OrigAmount>
                            ≈ {fiatStringAmount} {fiatCurrency}
                        </OrigAmount>
                    </Header>
                </>
            ) : (
                <Header>
                    <SummaryRow>
                        {fiatStringAmount} {fiatCurrency} {'->'}
                        <CoinLogo size={16} symbol={account.symbol} /> {account.symbol}
                    </SummaryRow>
                </Header>
            )}
            <Quotes>
                {quotes.map(quote => (
                    <StyledQuote
                        key={`${quote.exchange}-${quote.paymentMethod}-${quote.receiveCurrency}`}
                        quote={quote}
                        providers={providers}
                        selectQuote={selectQuote}
                    />
                ))}
            </Quotes>
        </Wrapper>
    );
};

export default Offers;
