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

import List from './List';
import SelectedOffer from './SelectedOffer';

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
        quotesRequest,
        selectedQuote,
        timer,
        REFETCH_INTERVAL_IN_SECONDS,
        account,
    } = useCoinmarketExchangeOffersContext();
    const { setLayout } = useContext(LayoutContext);

    useMemo(() => {
        if (setLayout) setLayout('Trezor Suite | Trade', undefined, <CoinmarketExchangeTopPanel />);
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
                                        <TextAmount>{quotesRequest.sendStringAmount}</TextAmount>
                                        <Text>{quotesRequest.send}</Text>
                                        <StyledIcon icon="ARROW_RIGHT_LONG" />
                                        <InvityCoinLogo
                                            src={`${invityAPI.server}/images/coins/suite/${quotesRequest.receive}.svg`}
                                        />
                                        <Text>{quotesRequest.receive}</Text>
                                    </Left>
                                    {!timer.isStopped && (
                                        <Right>
                                            <CoinmarketRefreshTime
                                                isLoading={timer.isLoading}
                                                refetchInterval={REFETCH_INTERVAL_IN_SECONDS}
                                                seconds={timer.timeSpend.seconds}
                                                label={
                                                    <Translation id="TR_EXCHANGE_OFFERS_REFRESH" />
                                                }
                                            />
                                        </Right>
                                    )}
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
