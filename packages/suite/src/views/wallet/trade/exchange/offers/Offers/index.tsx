import React, { useMemo, useContext, useState, useEffect } from 'react';
import styled from 'styled-components';
import invityAPI from '@suite-services/invityAPI';
import { LayoutContext, Translation } from '@suite-components';
import { CoinmarketExchangeTopPanel, CoinmarketFooter } from '@wallet-components';
import { variables, Icon, CoinLogo } from '@trezor/components';
import { useCoinmarketExchangeOffersContext } from '@wallet-hooks/useCoinmarketExchangeOffers';

import List from './List';
import SelectedOffer from './SelectedOffer';
import { differenceInSeconds } from 'date-fns';

const Wrapper = styled.div`
    padding: 0 32px 32px 32px;

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
    margin: 18px 0 24px 0;
`;

const SummaryRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: ${variables.FONT_SIZE.H2};
`;

const Text = styled.div`
    display: flex;
    padding-top: 3px;
    align-items: center;
`;

const StyledIcon = styled(Icon)`
    margin: 0 17px;
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
`;

const RefreshLabel = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const RefreshTime = styled.div`
    padding-left: 5px;
    text-align: right;
`;

const StyledCoinLogo = styled(CoinLogo)`
    padding: 0 10px 0 0;
`;

const InvityCoinLogo = styled.img`
    height: 18px;
    padding: 0 10px 0 0;
`;

const TextAmount = styled(Text)`
    padding-left: 10px;
`;

const Offers = () => {
    const {
        fixedQuotes,
        floatQuotes,
        quotesRequest,
        selectedQuote,
        account,
        lastFetchDate,
        REFETCH_INTERVAL,
    } = useCoinmarketExchangeOffersContext();
    const { setLayout } = useContext(LayoutContext);
    const [seconds, setSeconds] = useState(differenceInSeconds(new Date(), lastFetchDate));

    useEffect(() => {
        const interval = setInterval(() => {
            const seconds = differenceInSeconds(new Date(), lastFetchDate);
            setSeconds(seconds);
        }, 50);
        return () => clearInterval(interval);
    });

    useMemo(() => {
        if (setLayout)
            setLayout('Trezor Suite | Coinmarket', undefined, <CoinmarketExchangeTopPanel />);
    }, [setLayout]);

    if (!quotesRequest) return null;
    const quotesCount = fixedQuotes?.length + floatQuotes?.length;

    return (
        <Wrapper>
            {!selectedQuote && (
                <>
                    {!quotesCount && (
                        <NoQuotes>
                            <Translation id="TR_EXCHANGE_NO_OFFERS" />
                        </NoQuotes>
                    )}
                    {quotesCount > 0 && (
                        <>
                            <Header>
                                <SummaryRow>
                                    <Left>
                                        <StyledCoinLogo size={21} symbol={account.symbol} />
                                        <Text>{quotesRequest.send}</Text>
                                        <TextAmount>{quotesRequest.sendStringAmount}</TextAmount>
                                        <StyledIcon icon="ARROW_RIGHT_LONG" />
                                        <InvityCoinLogo
                                            src={`${invityAPI.server}/images/coins/suite/${quotesRequest.receive}.svg`}
                                        />
                                        <Text>{quotesRequest.receive}</Text>
                                    </Left>
                                    <Right>
                                        <RefreshLabel>
                                            <Translation id="TR_EXCHANGE_OFFERS_REFRESH" />
                                        </RefreshLabel>
                                        <RefreshTime>
                                            {Math.max(0, REFETCH_INTERVAL / 1000 - seconds)}s
                                        </RefreshTime>
                                    </Right>
                                </SummaryRow>
                            </Header>
                            {fixedQuotes?.length > 0 && <List quotes={fixedQuotes} isFixed />}
                            {floatQuotes?.length > 0 && <List quotes={floatQuotes} />}
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
