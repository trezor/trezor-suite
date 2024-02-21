import styled from 'styled-components';

import { Translation } from 'src/components/suite';
import { CoinLogo, H2, Icon, variables } from '@trezor/components';
import { useCoinmarketP2pOffersContext } from 'src/hooks/wallet/useCoinmarketP2pOffers';
import { CoinmarketFiatAmount, CoinmarketRefreshTime } from 'src/views/wallet/coinmarket/common';
import { InvityAPIReloadQuotesAfterSeconds } from 'src/constants/wallet/coinmarket/metadata';
import { P2pQuote } from 'invity-api';
import { Quote } from './Quote';

interface ListProps {
    quotes: P2pQuote[];
}

const Wrapper = styled.div``;

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

const Text = styled(H2)`
    padding-top: 3px;
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
`;

const StyledIcon = styled(Icon)`
    padding: 0 10px;
    margin: 0 20px;
`;

const Crypto = styled(H2)`
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

const Quotes = styled.div``;

const Divider = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    cursor: default;
    pointer-events: none;
    padding: 61px 0;
`;

const DividerLine = styled.div`
    height: 1px;
    flex: 1;
    background: ${({ theme }) => theme.STROKE_GREY};
`;

const DividerLeft = styled(DividerLine)``;

const DividerMiddle = styled.div`
    display: flex;
    align-items: center;
    padding: 5px 20px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    border-radius: 25px;
    border: 1px solid ${({ theme }) => theme.STROKE_GREY};
    background: ${({ theme }) => theme.BG_WHITE};
    text-align: center;
`;

const DividerRight = styled(DividerLine)``;

export const List = ({ quotes }: ListProps) => {
    const { account, timer, quotesRequest } = useCoinmarketP2pOffersContext();

    if (!quotesRequest) {
        return null;
    }

    const currencyMatches = (quote: P2pQuote) => quote.currency === quotesRequest.currency;
    const matchingQuotes = quotes.filter(quote => currencyMatches(quote));
    const alternativeQuotes = quotes.filter(quote => !currencyMatches(quote));

    return (
        <Wrapper data-test-id="@coinmarket/p2p/offers-list">
            <Header>
                <Left>
                    <SummaryRow>
                        <Text>
                            <CoinmarketFiatAmount
                                amount={quotesRequest.amount}
                                currency={quotesRequest.currency}
                            />
                        </Text>
                        <StyledIcon icon="ARROW_RIGHT_LONG" />
                        <CoinLogo size={21} symbol={account.symbol} />
                        <Crypto>{account.symbol.toUpperCase()}</Crypto>
                    </SummaryRow>
                </Left>
                {!timer.isStopped && (
                    <Right>
                        <CoinmarketRefreshTime
                            isLoading={timer.isLoading}
                            refetchInterval={InvityAPIReloadQuotesAfterSeconds}
                            seconds={timer.timeSpend.seconds}
                            label={<Translation id="TR_P2P_OFFERS_REFRESH" />}
                        />
                    </Right>
                )}
            </Header>
            <Quotes>
                {matchingQuotes?.length === 0 ? (
                    <NoQuotes>
                        <Translation id="TR_P2P_NO_OFFERS" />
                    </NoQuotes>
                ) : (
                    matchingQuotes.map(quote => (
                        <Quote key={`${quote.provider}-${quote.id}`} quote={quote} />
                    ))
                )}
            </Quotes>
            {alternativeQuotes.length > 0 && (
                <>
                    <Divider>
                        <DividerLeft />
                        <DividerMiddle>
                            <Translation id="TR_P2P_MORE_OFFERS_AVAILABLE" />
                        </DividerMiddle>
                        <DividerRight />
                    </Divider>
                    <Header>
                        <Text>
                            <Translation id="TR_P2P_ALTERNATIVE_OFFERS" />
                        </Text>
                    </Header>
                    <Quotes>
                        {alternativeQuotes.map(quote => (
                            <Quote key={`${quote.provider}-${quote.id}`} quote={quote} />
                        ))}
                    </Quotes>
                </>
            )}
        </Wrapper>
    );
};
