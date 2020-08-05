import React, { useState, useMemo, useContext } from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
import { CoinmarketTopPanel } from '@wallet-components';
import { variables } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';
import QuotesList from './QuotesList';
import SelectedQuote from './SelectedQuote';
import { useSelector, useActions } from '@suite/hooks/suite';

const Wrapper = styled.div`
    padding: 16px 32px 32px 32px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 16px;
    }
`;

const OtherOffersDivider = styled.div`
    padding: 16px 0;
    text-align: center;
`;

const Offers = () => {
    const { setLayout } = useContext(LayoutContext);

    useMemo(() => {
        if (setLayout) setLayout('Trezor Suite | Coinmarket', undefined, <CoinmarketTopPanel />);
    }, [setLayout]);

    const [selectedQuote, selectQuote] = useState(undefined);
    const quotes = useSelector(state => state.wallet.coinmarket.quotes);
    const alternativeQuotes = useSelector(state => state.wallet.coinmarket.alternativeQuotes);
    const { goto } = useActions({ goto: routerActions.goto });

    if (quotes.length === 0) {
        goto('wallet-coinmarket-buy');
    }

    return (
        <Wrapper>
            {!selectedQuote && (
                <>
                    <QuotesList selectQuote={selectQuote} quotes={quotes} />
                    {alternativeQuotes && alternativeQuotes.length > 0 && (
                        <>
                            <OtherOffersDivider>
                                Other offers in {alternativeQuotes[0].fiatCurrency}
                            </OtherOffersDivider>
                            <QuotesList
                                selectQuote={selectQuote}
                                quotes={alternativeQuotes}
                                isAlternative
                            />
                        </>
                    )}
                </>
            )}
            {selectedQuote && <SelectedQuote selectedQuote={selectedQuote} />}
        </Wrapper>
    );
};

export default Offers;
