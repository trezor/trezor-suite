import React from 'react';
import styled from 'styled-components';
import { CoinLogo, variables, Icon, colors } from '@trezor/components';
import Quote from './Quote';
import { BuyTrade } from '@suite/services/invityAPI/buyTypes';
import { useSelector } from '@suite-hooks';

const Wrapper = styled.div``;
const Quotes = styled.div``;

const StyledQuote = styled(Quote)`
    margin-bottom: 20px;
`;

const Header = styled.div`
    margin: 36px 0 24px 0;
`;

const SummaryRow = styled.div`
    display: flex;
    align-items: center;
    font-size: ${variables.FONT_SIZE.H2};
    text-transform: uppercase;
`;

const OrigAmount = styled.div`
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-size: smaller;
`;

const StyledIcon = styled(Icon)`
    padding: 0 10px;
`;

const Text = styled.div`
    display: flex;
    padding-top: 3px;
    align-items: center;
`;

const Crypto = styled(Text)`
    padding-left: 10px;
`;

const StyledCoinLogo = styled(CoinLogo)``;

interface Props {
    selectQuote: (quote: BuyTrade) => void;
    quotes?: BuyTrade[];
    isAlternative?: boolean;
}

const Offers = ({ selectQuote, quotes, isAlternative }: Props) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const quotesRequest = useSelector(state => state.wallet.coinmarket.buy.quotesRequest);
    const providers = useSelector(state => state.wallet.coinmarket.buy.buyInfo?.providerInfos);
    if (!quotesRequest || !quotes) return null;

    if (selectedAccount.status !== 'loaded') return null;
    const { account } = selectedAccount;
    const { fiatStringAmount, fiatCurrency } = quotesRequest;

    return (
        <Wrapper>
            <Header>
                {isAlternative ? (
                    <>
                        <SummaryRow>
                            <Text>
                                {quotes[0].fiatStringAmount} {quotes[0].fiatCurrency}
                            </Text>
                            <StyledIcon icon="ARROW_RIGHT" />
                            <StyledCoinLogo size={21} symbol={account.symbol} />
                            <Crypto>{account.symbol}</Crypto>
                        </SummaryRow>
                        <OrigAmount>
                            ≈ {fiatStringAmount} {fiatCurrency}
                        </OrigAmount>
                    </>
                ) : (
                    <SummaryRow>
                        <Text>
                            {fiatStringAmount} {fiatCurrency}{' '}
                        </Text>
                        <StyledIcon icon="ARROW_RIGHT" />
                        <StyledCoinLogo size={21} symbol={account.symbol} />
                        <Crypto>{account.symbol}</Crypto>
                    </SummaryRow>
                )}
            </Header>
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
