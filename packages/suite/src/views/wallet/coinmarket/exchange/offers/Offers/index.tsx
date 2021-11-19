import React, { useMemo, useContext } from 'react';
import styled from 'styled-components';
import invityAPI from '@suite-services/invityAPI';
import { LayoutContext, Translation } from '@suite-components';
import {
    CoinmarketExchangeTopPanel,
    CoinmarketFooter,
    CoinmarketRefreshTime,
} from '@wallet-components';
import { variables, Icon, CoinLogo, H2 } from '@trezor/components';
import { useCoinmarketExchangeOffersContext } from '@wallet-hooks/useCoinmarketExchangeOffers';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';
import { InvityAPIReloadQuotesAfterSeconds } from '@wallet-constants/coinmarket/metadata';
import List from './List';
import SelectedOffer from './SelectedOffer';
import NoOffers from '@wallet-views/coinmarket/common/no-offers';

const Wrapper = styled.div`
    padding: 0 32px 32px 32px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 16px;
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 0;
    }
`;

const Header = styled.div`
    margin: 18px 0 24px 0;

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

const TextAmount = styled(Text)`
    padding-right: 10px;
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
    const { setLayout } = useContext(LayoutContext);
    const { navigateToExchangeForm } = useCoinmarketNavigation(account);

    useMemo(() => {
        if (setLayout) setLayout('Trezor Suite | Trade', undefined, <CoinmarketExchangeTopPanel />);
    }, [setLayout]);

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
                                        <TextAmount>{quotesRequest.sendStringAmount}</TextAmount>
                                        <Text>{quotesRequest.send}</Text>
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
                            {dexQuotes.length > 0 && <List quotes={dexQuotes} type="dex" />}
                            {fixedQuotes.length > 0 && <List quotes={fixedQuotes} type="fixed" />}
                            {floatQuotes.length > 0 && <List quotes={floatQuotes} type="float" />}
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
