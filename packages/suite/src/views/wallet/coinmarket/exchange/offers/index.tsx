import React, { useState, useMemo, useContext } from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
import { CoinmarketTopPanel, CoinmarketFooter } from '@wallet-components';
import { variables, Icon } from '@trezor/components';
import { useSelector, useActions } from '@suite/hooks/suite';
import { ExchangeTrade } from 'invity-api';
import * as modalActions from '@suite-actions/modalActions';

import List from './components/List';
import SelectedOffer from './components/SelectedOffer';

const Wrapper = styled.div`
    padding: 16px 32px 32px 32px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 16px;
    }
`;

const NoQuotes = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: column;
    min-height: 550px;
    align-items: center;
    flex: 1;
`;

const Header = styled.div`
    margin: 36px 0 24px 0;
`;

const SummaryRow = styled.div`
    display: flex;
    align-items: center;
    font-size: ${variables.FONT_SIZE.H2};
    text-transform: uppercase;
`;

const Text = styled.div`
    display: flex;
    padding-top: 3px;
    align-items: center;
`;

const StyledIcon = styled(Icon)`
    padding: 0 10px;
`;

const Offers = () => {
    const { setLayout } = useContext(LayoutContext);

    useMemo(() => {
        if (setLayout) setLayout('Trezor Suite | Coinmarket', undefined, <CoinmarketTopPanel />);
    }, [setLayout]);

    const [selectedQuote, setSelectQuote] = useState<ExchangeTrade>();
    const quotesRequest = useSelector(state => state.wallet.coinmarket.exchange.quotesRequest);
    const fixedQuotes = useSelector(state => state.wallet.coinmarket.exchange.fixedQuotes);
    const floatQuotes = useSelector(state => state.wallet.coinmarket.exchange.floatQuotes);
    const quotesCount = fixedQuotes?.length + floatQuotes?.length;
    const { openModal } = useActions({ openModal: modalActions.openModal });

    if (!quotesRequest) return null;

    const selectQuote = (quote: ExchangeTrade) => {
        openModal({
            type: 'coinmarket-confirm-terms',
            onConfirm: () => {
                setSelectQuote(quote);
            },
        });
    };

    return (
        <Wrapper>
            {!quotesCount && <NoQuotes>No quotes here</NoQuotes>}

            {!selectedQuote && quotesCount > 0 && (
                <>
                    <Header>
                        <SummaryRow>
                            <Text>{`${quotesRequest.sendStringAmount} ${quotesRequest.send}`}</Text>
                            <StyledIcon icon="ARROW_RIGHT" />
                            <Text>{quotesRequest.receive}</Text>
                        </SummaryRow>
                    </Header>

                    {fixedQuotes?.length && (
                        <List selectQuote={selectQuote} quotes={fixedQuotes} isFixed />
                    )}
                    {floatQuotes?.length && <List selectQuote={selectQuote} quotes={floatQuotes} />}
                </>
            )}
            {selectedQuote && <SelectedOffer selectedQuote={selectedQuote} />}
            <CoinmarketFooter />
        </Wrapper>
    );
};

export default Offers;
