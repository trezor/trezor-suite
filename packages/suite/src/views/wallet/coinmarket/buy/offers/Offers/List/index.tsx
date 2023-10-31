import styled from 'styled-components';
import { CoinLogo, variables, Icon, H2 } from '@trezor/components';
import { BuyTrade } from 'invity-api';
import { useCoinmarketBuyOffersContext } from 'src/hooks/wallet/useCoinmarketBuyOffers';
import Quote from './Quote';
import { Translation } from 'src/components/suite';
import {
    CoinmarketCryptoAmount,
    CoinmarketFiatAmount,
    CoinmarketRefreshTime,
} from 'src/views/wallet/coinmarket/common';
import { InvityAPIReloadQuotesAfterSeconds } from 'src/constants/wallet/coinmarket/metadata';

const Wrapper = styled.div``;
const Quotes = styled.div``;

const StyledQuote = styled(Quote)`
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

const SummaryRow = styled.div`
    display: flex;
    align-items: center;
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
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
`;

const Receive = styled(H2)`
    padding-top: 3px;
    padding-left: 10px;
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
    quotes: BuyTrade[];
}

const List = ({ isAlternative, quotes }: ListProps) => {
    const { account, quotesRequest, timer } = useCoinmarketBuyOffersContext();

    if (!quotesRequest) return null;
    const { fiatStringAmount, fiatCurrency, wantCrypto } = quotesRequest;

    return (
        <Wrapper data-test="@coinmarket/buy/offers-list">
            <Header>
                <Left>
                    <SummaryRow>
                        <Send>
                            <CoinmarketFiatAmount
                                amount={!wantCrypto ? quotes[0].fiatStringAmount : ''}
                                currency={quotes[0].fiatCurrency}
                            />
                        </Send>
                        <StyledIcon icon="ARROW_RIGHT_LONG" />
                        <CoinLogo size={21} symbol={account.symbol} />
                        <Receive>
                            <CoinmarketCryptoAmount
                                amount={wantCrypto ? quotes[0].receiveStringAmount : ''}
                                symbol={account.symbol}
                            />
                        </Receive>
                    </SummaryRow>
                    {isAlternative && !wantCrypto && (
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
                            label={<Translation id="TR_BUY_OFFERS_REFRESH" />}
                        />
                    </Right>
                )}
            </Header>
            <Quotes>
                {quotes?.length === 0 ? (
                    <NoQuotes>
                        <Translation id="TR_BUY_NO_OFFERS" />
                    </NoQuotes>
                ) : (
                    quotes.map(quote => (
                        <StyledQuote
                            wantCrypto={wantCrypto}
                            key={`${quote.exchange}-${quote.paymentMethod}-${quote.receiveCurrency}`}
                            quote={quote}
                        />
                    ))
                )}
            </Quotes>
        </Wrapper>
    );
};

export default List;
