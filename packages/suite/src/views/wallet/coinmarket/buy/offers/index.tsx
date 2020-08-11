import React, { useState, useMemo, useContext } from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
import { CoinmarketTopPanel, CoinmarketFooter } from '@wallet-components';
import { variables, colors } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';
import QuotesList from './QuotesList';
import SelectedQuote from './SelectedQuote';
import { useSelector, useActions } from '@suite/hooks/suite';
import { BuyTrade } from 'invity-api';
import * as modalActions from '@suite-actions/modalActions';
import invityAPI from '@suite/services/invityAPI';
import { createQuoteLink, submitRequestForm } from '@suite/utils/wallet/coinmarket/buyUtils';

const Wrapper = styled.div`
    padding: 16px 32px 32px 32px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 16px;
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
    background: ${colors.NEUE_STROKE_GREY};
`;

const DividerLeft = styled(DividerLine)``;
const DividerRight = styled(DividerLine)``;

const Currency = styled.div`
    color: ${colors.NEUE_TYPE_DARK_GREY};
    text-transform: uppercase;
    padding-left: 3px;
`;

const DividerMiddle = styled.div`
    display: flex;
    align-items: center;
    padding: 5px 20px;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    border-radius: 25px;
    border: 1px solid ${colors.NEUE_STROKE_GREY};
    background: ${colors.WHITE};
    text-align: center;
`;

const Offers = () => {
    const { setLayout } = useContext(LayoutContext);

    useMemo(() => {
        if (setLayout) setLayout('Trezor Suite | Coinmarket', undefined, <CoinmarketTopPanel />);
    }, [setLayout]);

    const [selectedQuote, setSelectQuote] = useState<BuyTrade>();
    const quotesRequest = useSelector(state => state.wallet.coinmarket.buy.quotesRequest);
    const quotes = useSelector(state => state.wallet.coinmarket.buy.quotes);
    const alternativeQuotes = useSelector(state => state.wallet.coinmarket.buy.alternativeQuotes);
    const { goto } = useActions({ goto: routerActions.goto });
    const { openModal } = useActions({ openModal: modalActions.openModal });

    if (quotesRequest == null) {
        return null;
    }

    const selectQuote = (quote: BuyTrade) => {
        openModal({
            type: 'coinmarket-confirm-terms',
            onConfirm: async () => {
                // empty quoteId means the partner requests login first, requestTrade to get login screen
                if (!quote.quoteId) {
                    const response = await invityAPI.doBuyTrade({
                        trade: quote,
                        returnUrl: createQuoteLink(quotesRequest),
                    });
                    // TODO - finish error handling - probably use modal to show the error to the user
                    if (response) {
                        if (response.trade.status === 'LOGIN_REQUEST' && response.tradeForm) {
                            submitRequestForm(response.tradeForm);
                        } else {
                            const errorMessage = `[doBuyTrade] ${response.trade.status} ${response.trade.error}`;
                            console.log(errorMessage);
                        }
                    } else {
                        const errorMessage = '[doBuyTrade] no response from the server';
                        console.log(errorMessage);
                    }
                } else {
                    setSelectQuote(quote);
                }
            },
        });
    };

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
                            <Divider>
                                <DividerLeft />
                                <DividerMiddle>
                                    Other offers in{' '}
                                    <Currency>{alternativeQuotes[0].fiatCurrency}</Currency>
                                </DividerMiddle>
                                <DividerRight />
                            </Divider>
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
            <CoinmarketFooter />
        </Wrapper>
    );
};

export default Offers;
