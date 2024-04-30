import styled from 'styled-components';

import { CoinmarketFooter, NoOffers } from 'src/views/wallet/coinmarket/common';
import { variables } from '@trezor/components';
import { useLayout } from 'src/hooks/suite';
import { useCoinmarketBuyOffersContext } from 'src/hooks/wallet/useCoinmarketBuyOffers';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import SelectedOffer from './SelectedOffer';
import { BuyQuoteList } from './List/BuyQuoteList';

const Wrapper = styled.div`
    padding: 16px 32px 32px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 16px;
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 0;
    }
`;

const Offers = () => {
    const { account, quotes, selectedQuote, timer, getQuotes } = useCoinmarketBuyOffersContext();
    const { navigateToBuyForm } = useCoinmarketNavigation(account);

    useLayout('Trezor Suite | Trade', () => <PageHeader backRoute="wallet-coinmarket-buy" />);

    const hasLoadingFailed = !quotes;
    const noOffers = hasLoadingFailed || quotes.length === 0;

    return (
        <Wrapper>
            {!selectedQuote &&
                (noOffers ? (
                    <NoOffers
                        coinmarketRefreshTimeIsLoading={timer.isLoading}
                        coinmarketRefreshTimeSeconds={timer.timeSpend.seconds}
                        onBackButtonClick={navigateToBuyForm}
                        onReloadOffersButtonClick={getQuotes}
                        hasLoadingFailed={hasLoadingFailed}
                    />
                ) : (
                    quotes.length > 0 && <BuyQuoteList quotes={quotes} />
                ))}
            {selectedQuote && <SelectedOffer />}
            <CoinmarketFooter />
        </Wrapper>
    );
};

export default Offers;
