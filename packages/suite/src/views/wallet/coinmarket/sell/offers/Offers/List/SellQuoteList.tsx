import styled from 'styled-components';
import { SellFiatTrade } from 'invity-api';

import { CoinLogo, variables, Icon, H2 } from '@trezor/components';
import { useCoinmarketSellOffersContext } from 'src/hooks/wallet/useCoinmarketSellOffers';
import { Translation } from 'src/components/suite';
import { CoinmarketRefreshTime } from 'src/views/wallet/coinmarket/common';
import { InvityAPIReloadQuotesAfterSeconds } from 'src/constants/wallet/coinmarket/metadata';
import { CoinmarketCryptoAmount } from 'src/views/wallet/coinmarket/common/CoinmarketCryptoAmount';
import { CoinmarketFiatAmount } from 'src/views/wallet/coinmarket/common/CoinmarketFiatAmount';
import { SellQuote } from './SellQuote';

const Wrapper = styled.div``;
const Quotes = styled.div``;

const StyledSellQuote = styled(SellQuote)`
    margin-bottom: 20px;
`;

const Header = styled.div`
    margin: 36px 0 24px;
    display: flex;
    justify-content: space-between;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin: 12px 0 24px;
        flex-direction: column;
        align-items: center;
    }
`;

const Left = styled.div``;
const Right = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin-top: 6px;
    }
`;

const SummaryRow = styled(H2)`
    display: flex;
    align-items: center;
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
`;

const OrigAmount = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const StyledIcon = styled(Icon)`
    padding: 0 10px;
    margin: 0 20px;
`;

const Send = styled(H2)`
    padding-top: 3px;
    padding-left: 10px;
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
`;

const Receive = styled(H2)`
    padding-top: 3px;
    padding-right: 10px;
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
`;

const NoQuotes = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    flex: 1;
`;

interface ListProps {
    isAlternative?: boolean;
    quotes: SellFiatTrade[];
}

export const SellQuoteList = ({ isAlternative, quotes }: ListProps) => {
    const { account, quotesRequest, timer } = useCoinmarketSellOffersContext();

    if (!quotesRequest) return null;
    const { fiatStringAmount, fiatCurrency, amountInCrypto } = quotesRequest;

    return (
        <Wrapper>
            <Header>
                <Left>
                    <SummaryRow>
                        <CoinLogo size={21} symbol={account.symbol} />
                        <Send>
                            <CoinmarketCryptoAmount
                                amount={amountInCrypto ? quotes[0].cryptoStringAmount : ''}
                                symbol={account.symbol}
                            />
                        </Send>
                        <StyledIcon icon="ARROW_RIGHT_LONG" />
                        <Receive>
                            <CoinmarketFiatAmount
                                amount={!amountInCrypto ? quotes[0].fiatStringAmount : ''}
                                currency={quotes[0].fiatCurrency}
                            />
                        </Receive>
                    </SummaryRow>
                    {isAlternative && !amountInCrypto && (
                        <OrigAmount>
                            ≈{' '}
                            <CoinmarketFiatAmount
                                amount={fiatStringAmount}
                                currency={fiatCurrency}
                            />
                        </OrigAmount>
                    )}
                </Left>
                {!isAlternative && !timer.isStopped && (
                    <Right>
                        <CoinmarketRefreshTime
                            isLoading={timer.isLoading}
                            refetchInterval={InvityAPIReloadQuotesAfterSeconds}
                            seconds={timer.timeSpend.seconds}
                            label={<Translation id="TR_SELL_OFFERS_REFRESH" />}
                        />
                    </Right>
                )}
            </Header>
            <Quotes>
                {quotes?.length === 0 ? (
                    <NoQuotes>
                        <Translation id="TR_SELL_NO_OFFERS" />
                    </NoQuotes>
                ) : (
                    quotes.map(quote => (
                        <StyledSellQuote
                            amountInCrypto={amountInCrypto}
                            key={`${quote.exchange}-${quote.paymentMethod}-${quote.fiatCurrency}`}
                            quote={quote}
                        />
                    ))
                )}
            </Quotes>
        </Wrapper>
    );
};
