import React, { useEffect, useState } from 'react';
import { differenceInSeconds } from 'date-fns';
import styled from 'styled-components';
import { CoinLogo, variables, Icon, colors } from '@trezor/components';
import { BuyTrade } from 'invity-api';
import { useCoinmarketOffersContext } from '@wallet-hooks/useCoinmarketOffers';

import Quote from './Quote';

interface Props {
    isAlternative?: boolean;
    quotes: BuyTrade[];
}

const List = ({ isAlternative, quotes }: Props) => {
    const {
        account,
        quotesRequest,
        lastFetchDate,
        REFETCH_INTERVAL,
    } = useCoinmarketOffersContext();
    const [seconds, setSeconds] = useState(differenceInSeconds(new Date(), lastFetchDate));

    useEffect(() => {
        const interval = setInterval(() => {
            const seconds = differenceInSeconds(new Date(), lastFetchDate);
            setSeconds(seconds);
        }, 50);
        return () => clearInterval(interval);
    });

    if (!quotesRequest) return null;
    const { fiatStringAmount, fiatCurrency, cryptoStringAmount, wantCrypto } = quotesRequest;

    return (
        <Wrapper>
            <Header>
                <Left>
                    {isAlternative ? (
                        <>
                            <SummaryRow>
                                <Text>
                                    {wantCrypto ? '' : `${quotes[0].fiatStringAmount} `}
                                    {quotes[0].fiatCurrency}
                                </Text>
                                <StyledIcon icon="ARROW_RIGHT" />
                                {wantCrypto && <Receive>{quotes[0].receiveStringAmount}</Receive>}
                                <StyledCoinLogo size={21} symbol={account.symbol} />
                                <Crypto>{account.symbol}</Crypto>
                            </SummaryRow>
                            {!wantCrypto && (
                                <OrigAmount>
                                    ≈ {fiatStringAmount} {fiatCurrency}
                                </OrigAmount>
                            )}
                        </>
                    ) : (
                        <SummaryRow>
                            <Text>
                                {wantCrypto ? '' : `${fiatStringAmount} `}
                                {fiatCurrency}
                            </Text>
                            <StyledIcon icon="ARROW_RIGHT" />
                            {wantCrypto && <Receive>{cryptoStringAmount}</Receive>}
                            <StyledCoinLogo size={21} symbol={account.symbol} />
                            <Crypto>{account.symbol}</Crypto>
                        </SummaryRow>
                    )}
                </Left>
                <Right>{!isAlternative && REFETCH_INTERVAL / 1000 - seconds}</Right>
            </Header>
            <Quotes>
                {quotes.map(quote => (
                    <StyledQuote
                        wantCrypto={wantCrypto}
                        key={`${quote.exchange}-${quote.paymentMethod}-${quote.receiveCurrency}`}
                        quote={quote}
                    />
                ))}
            </Quotes>
        </Wrapper>
    );
};

const Wrapper = styled.div``;
const Quotes = styled.div``;

const StyledQuote = styled(Quote)`
    margin-bottom: 20px;
`;

const Header = styled.div`
    margin: 36px 0 24px 0;
    display: flex;
    justify-content: space-between;
`;

const Left = styled.div``;
const Right = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
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

const Receive = styled(Text)`
    padding-right: 10px;
`;

const StyledCoinLogo = styled(CoinLogo)``;

export default List;
