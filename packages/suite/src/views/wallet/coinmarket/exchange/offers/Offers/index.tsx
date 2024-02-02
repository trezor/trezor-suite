import styled from 'styled-components';
import invityAPI from 'src/services/suite/invityAPI';
import { FormattedCryptoAmount, Translation } from 'src/components/suite';
import {
    CoinmarketFooter,
    CoinmarketRefreshTime,
    CoinmarketTopPanel,
    NoOffers,
} from 'src/views/wallet/coinmarket/common';
import { variables, Icon, CoinLogo, H2 } from '@trezor/components';
import { useLayout } from 'src/hooks/suite';
import { useCoinmarketExchangeOffersContext } from 'src/hooks/wallet/useCoinmarketExchangeOffers';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { InvityAPIReloadQuotesAfterSeconds } from 'src/constants/wallet/coinmarket/metadata';
import SelectedOffer from './SelectedOffer';
import { ExchangeQuoteList } from './List/ExchangeQuoteList';

const Wrapper = styled.div`
    padding: 0 32px 32px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 16px;
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 0;
    }
`;

const Header = styled.div`
    margin: 18px 0 24px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin: 12px 0 24px;
    }
`;

const SummaryRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

const Text = styled(H2)`
    display: flex;
    padding-top: 3px;
    align-items: center;
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
`;

const StyledIcon = styled(Icon)`
    padding: 0 10px;
    margin: 0 20px;
`;

const Left = styled.div`
    display: flex;
    align-items: center;
`;

const Right = styled.div`
    display: flex;
    justify-self: flex-end;
    align-items: center;
    font-size: ${variables.FONT_SIZE.SMALL};

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin-top: 6px;
    }
`;

const StyledCoinLogo = styled(CoinLogo)`
    padding: 0 10px 0 0;
`;

const InvityCoinLogo = styled.img`
    height: 18px;
    padding: 0 10px 0 0;
`;

const Offers = () => {
    const {
        fixedQuotes,
        floatQuotes,
        dexQuotes,
        quotesRequest,
        selectedQuote,
        timer,
        account,
        getQuotes,
    } = useCoinmarketExchangeOffersContext();
    const { navigateToExchangeForm } = useCoinmarketNavigation(account);

    useLayout('Trezor Suite | Trade', () => (
        <CoinmarketTopPanel backRoute="wallet-coinmarket-exchange" />
    ));

    if (!quotesRequest) return null;
    const hasLoadingFailed = !(fixedQuotes && floatQuotes && dexQuotes);
    const noOffers =
        hasLoadingFailed ||
        (fixedQuotes.length === 0 && floatQuotes.length === 0 && dexQuotes.length === 0);
    return (
        <Wrapper>
            {!selectedQuote && (
                <>
                    {noOffers ? (
                        <NoOffers
                            coinmarketRefreshTimeIsLoading={timer.isLoading}
                            coinmarketRefreshTimeSeconds={timer.timeSpend.seconds}
                            onBackButtonClick={navigateToExchangeForm}
                            onReloadOffersButtonClick={getQuotes}
                            hasLoadingFailed={hasLoadingFailed}
                        />
                    ) : (
                        <>
                            <Header>
                                <SummaryRow>
                                    <Left>
                                        <StyledCoinLogo size={21} symbol={account.symbol} />
                                        <Text>
                                            <FormattedCryptoAmount
                                                value={quotesRequest.sendStringAmount}
                                                symbol={quotesRequest.send}
                                            />
                                        </Text>
                                        <StyledIcon icon="ARROW_RIGHT_LONG" />
                                        <InvityCoinLogo
                                            src={`${invityAPI.getApiServerUrl()}/images/coins/suite/${
                                                quotesRequest.receive
                                            }.svg`}
                                        />
                                        <Text>{quotesRequest.receive}</Text>
                                    </Left>
                                    {!timer.isStopped && (
                                        <Right>
                                            <CoinmarketRefreshTime
                                                isLoading={timer.isLoading}
                                                refetchInterval={InvityAPIReloadQuotesAfterSeconds}
                                                seconds={timer.timeSpend.seconds}
                                                label={
                                                    <Translation id="TR_EXCHANGE_OFFERS_REFRESH" />
                                                }
                                            />
                                        </Right>
                                    )}
                                </SummaryRow>
                            </Header>
                            {dexQuotes.length > 0 && (
                                <ExchangeQuoteList quotes={dexQuotes} type="dex" />
                            )}
                            {fixedQuotes.length > 0 && (
                                <ExchangeQuoteList quotes={fixedQuotes} type="fixed" />
                            )}
                            {floatQuotes.length > 0 && (
                                <ExchangeQuoteList quotes={floatQuotes} type="float" />
                            )}
                        </>
                    )}
                </>
            )}
            {selectedQuote && <SelectedOffer />}
            <CoinmarketFooter />
        </Wrapper>
    );
};

export default Offers;
