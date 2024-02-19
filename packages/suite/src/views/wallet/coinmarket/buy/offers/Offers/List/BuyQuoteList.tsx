import styled from 'styled-components';
import { variables, Icon, H2 } from '@trezor/components';
import { BuyTrade } from 'invity-api';
import { useCoinmarketBuyOffersContext } from 'src/hooks/wallet/useCoinmarketBuyOffers';
import { Translation } from 'src/components/suite';
import {
    CoinmarketCryptoAmount,
    CoinmarketFiatAmount,
    CoinmarketRefreshTime,
} from 'src/views/wallet/coinmarket/common';
import { InvityAPIReloadQuotesAfterSeconds } from 'src/constants/wallet/coinmarket/metadata';
import { BuyQuote } from './BuyQuote';
import invityAPI from 'src/services/suite/invityAPI';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';

const Wrapper = styled.div``;
const Quotes = styled.div``;

const StyledBuyQuote = styled(BuyQuote)`
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

const TokenLogo = styled.img`
    display: flex;
    align-items: center;
    height: 21px;
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

export const BuyQuoteList = ({ isAlternative, quotes }: ListProps) => {
    const { quotesRequest, timer } = useCoinmarketBuyOffersContext();

    if (!quotesRequest) return null;
    const { fiatStringAmount, fiatCurrency, wantCrypto } = quotesRequest;

    return (
        <Wrapper data-test-id="@coinmarket/buy/offers-list">
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
                        <TokenLogo
                            src={invityAPI.getCoinLogoUrl(
                                cryptoToCoinSymbol(quotes[0].receiveCurrency!),
                            )}
                        />
                        <Receive>
                            <CoinmarketCryptoAmount
                                amount={wantCrypto ? quotes[0].receiveStringAmount : ''}
                                symbol={cryptoToCoinSymbol(quotes[0].receiveCurrency!)}
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
                        <StyledBuyQuote
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
