import styled from 'styled-components';

import {
    CoinmarketFooter,
    CoinmarketSellTopPanel,
    NoOffers,
} from 'src/views/wallet/coinmarket/common';
import { variables } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useLayout } from 'src/hooks/suite/useLayout';
import { useCoinmarketSellOffersContext } from 'src/hooks/wallet/useCoinmarketSellOffers';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { SelectedOffer } from './SelectedOffer';
import { SellQuoteList } from './List/SellQuoteList';

const Wrapper = styled.div`
    padding: 16px 32px 32px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 16px;
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 0;
    }
`;

const Divider = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    cursor: default;
    padding: 61px 0;
`;

const DividerLine = styled.div`
    height: 1px;
    flex: 1;
    background: ${({ theme }) => theme.STROKE_GREY};
`;

const DividerLeft = styled(DividerLine)``;
const DividerRight = styled(DividerLine)``;

const Currency = styled.div`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    text-transform: capitalize;
    padding-left: 3px;
`;

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

const Offers = () => {
    const { account, quotes, alternativeQuotes, selectedQuote, timer, getQuotes } =
        useCoinmarketSellOffersContext();
    const { navigateToSellForm } = useCoinmarketNavigation(account);

    useLayout('Trezor Suite | Trade', CoinmarketSellTopPanel);

    const hasLoadingFailed = !(quotes && alternativeQuotes);
    const noOffers = hasLoadingFailed || (quotes.length === 0 && alternativeQuotes.length === 0);
    return (
        <Wrapper>
            {!selectedQuote && (
                <>
                    {noOffers ? (
                        <NoOffers
                            coinmarketRefreshTimeIsLoading={timer.isLoading}
                            coinmarketRefreshTimeSeconds={timer.timeSpend.seconds}
                            onBackButtonClick={navigateToSellForm}
                            onReloadOffersButtonClick={getQuotes}
                            hasLoadingFailed={hasLoadingFailed}
                        />
                    ) : (
                        <>
                            <SellQuoteList quotes={quotes} />
                            {alternativeQuotes.length > 0 && (
                                <>
                                    <Divider>
                                        <DividerLeft />
                                        <DividerMiddle>
                                            <Translation id="TR_SELL_OTHER_OFFERS_IN" />
                                            <Currency>{alternativeQuotes[0].fiatCurrency}</Currency>
                                        </DividerMiddle>
                                        <DividerRight />
                                    </Divider>
                                    <SellQuoteList isAlternative quotes={alternativeQuotes} />
                                </>
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
