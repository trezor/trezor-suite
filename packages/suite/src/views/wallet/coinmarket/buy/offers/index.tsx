import React, { useState, useMemo, useContext } from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
import { CoinmarketTopPanel } from '@wallet-components';
import { variables } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';
import QuotesList from './components/QuotesList';
import SelectedQuote from './components/SelectedQuote';
import { useSelector, useActions } from '@suite/hooks/suite';

const Wrapper = styled.div`
    padding: 16px 32px 32px 32px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 16px;
    }
`;

const Offers = () => {
    const { setLayout } = useContext(LayoutContext);

    useMemo(() => {
        if (setLayout) setLayout('Trezor Suite | Coinmarket', undefined, <CoinmarketTopPanel />);
    }, [setLayout]);

    const [selectedQuote, selectQuote] = useState(null);
    const quotes = useSelector(state => state.wallet.coinmarket.quotes);
    const { goto } = useActions({ goto: routerActions.goto });

    if (quotes.length === 0) {
        goto('wallet-coinmarket-buy');
    }

    return (
        <Wrapper>
            {!selectedQuote && <QuotesList selectQuote={selectQuote} quotes={quotes} />}
            {selectedQuote && <SelectedQuote selectedQuote={selectedQuote} />}
        </Wrapper>
    );
};

export default Offers;
