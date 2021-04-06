import React, { useEffect, useContext } from 'react';
import styled from 'styled-components';
import { CoinmarketFooter, CoinmarketSellTopPanel } from '@wallet-components';
import { variables } from '@trezor/components';
import { LayoutContext, Translation } from '@suite-components';
import { useCoinmarketSellOffersContext } from '@wallet-hooks/useCoinmarketSellOffers';

import List from './List';
import SelectedOffer from './SelectedOffer';

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
    background: ${props => props.theme.STROKE_GREY};
`;

const DividerLeft = styled(DividerLine)``;
const DividerRight = styled(DividerLine)``;

const Currency = styled.div`
    color: ${props => props.theme.TYPE_DARK_GREY};
    text-transform: uppercase;
    padding-left: 3px;
`;

const DividerMiddle = styled.div`
    display: flex;
    align-items: center;
    padding: 5px 20px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    border-radius: 25px;
    border: 1px solid ${props => props.theme.STROKE_GREY};
    background: ${props => props.theme.BG_WHITE};
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

const Offers = () => {
    const { quotes, alternativeQuotes, selectedQuote } = useCoinmarketSellOffersContext();
    const { setLayout } = useContext(LayoutContext);

    useEffect(() => {
        if (setLayout) setLayout('Trezor Suite | Trade', undefined, <CoinmarketSellTopPanel />);
    }, [setLayout]);

    return (
        <Wrapper>
            {!selectedQuote && (
                <>
                    {quotes?.length === 0 && alternativeQuotes?.length === 0 ? (
                        <NoQuotes>
                            <Translation id="TR_SELL_NO_OFFERS" />
                        </NoQuotes>
                    ) : (
                        <>
                            <List quotes={quotes} />
                            {alternativeQuotes && alternativeQuotes.length > 0 && (
                                <>
                                    <Divider>
                                        <DividerLeft />
                                        <DividerMiddle>
                                            <Translation id="TR_SELL_OTHER_OFFERS_IN" />
                                            <Currency>{alternativeQuotes[0].fiatCurrency}</Currency>
                                        </DividerMiddle>
                                        <DividerRight />
                                    </Divider>
                                    <List isAlternative quotes={alternativeQuotes} />
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
