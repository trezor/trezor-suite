import React, { useMemo, useContext } from 'react';
import styled from 'styled-components';
import { CoinmarketFooter, CoinmarketTopPanel } from '@wallet-components';
import { variables, colors } from '@trezor/components';
import { LayoutContext, Translation } from '@suite-components';
import { useCoinmarketBuyOffersContext } from '@wallet-hooks/useCoinmarketBuyOffers';

import List from './List';
import SelectedOffer from './SelectedOffer';

const Offers = () => {
    const { quotes, alternativeQuotes, selectedQuote } = useCoinmarketBuyOffersContext();
    const { setLayout } = useContext(LayoutContext);

    useMemo(() => {
        if (setLayout) setLayout('Trezor Suite | Coinmarket', undefined, <CoinmarketTopPanel />);
    }, [setLayout]);

    return (
        <Wrapper>
            {quotes?.length === 0 && alternativeQuotes?.length === 0 && (
                <NoQuotes>No quotes here</NoQuotes>
            )}
            {!selectedQuote && quotes.length > 0 && (
                <>
                    <List quotes={quotes} />
                    {alternativeQuotes && alternativeQuotes.length > 0 && (
                        <>
                            <Divider>
                                <DividerLeft />
                                <DividerMiddle>
                                    <Translation id="TR_BUY_OTHER_OFFERS_IN" />
                                    <Currency>{alternativeQuotes[0].fiatCurrency}</Currency>
                                </DividerMiddle>
                                <DividerRight />
                            </Divider>
                            <List isAlternative quotes={alternativeQuotes} />
                        </>
                    )}
                </>
            )}
            {selectedQuote && <SelectedOffer />}
            <CoinmarketFooter />
        </Wrapper>
    );
};

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

const NoQuotes = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: column;
    min-height: 550px;
    align-items: center;
    flex: 1;
`;

export default Offers;
