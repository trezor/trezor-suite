import React, { useEffect } from 'react';
import styled from 'styled-components';
import { BuyTradeQuoteRequest } from 'invity-api';
import { Account } from '@wallet-types';
import { useSelector, useActions } from '@suite/hooks/suite';
import * as routerActions from '@suite-actions/routerActions';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
    height: 100%;
`;

const CoinmarketRedirect = () => {
    const { goto } = useActions({ goto: routerActions.goto });
    const { saveQuoteRequest, saveCachedAccountInfo } = useActions({
        saveQuoteRequest: coinmarketBuyActions.saveQuoteRequest,
        saveCachedAccountInfo: coinmarketBuyActions.saveCachedAccountInfo,
    });
    const router = useSelector(state => state.router);
    const params = router?.hash?.split('/');

    useEffect(() => {
        if (!params) return;

        const redirectParams = {
            routeType: params[0] as 'offers',
            symbol: params[1] as Account['symbol'],
            index: params[2] as Account['accountType'],
            accountType: params[3] as Account['accountType'],
        };

        const redirectWithQuotes = async () => {
            if (redirectParams.routeType === 'offers') {
                const wantCrypto = params[6] === 'qc';
                let request: BuyTradeQuoteRequest;
                if (wantCrypto) {
                    request = {
                        wantCrypto,
                        fiatCurrency: params[8],
                        receiveCurrency: params[10],
                        country: params[7],
                        cryptoStringAmount: params[9],
                    };
                } else {
                    request = {
                        wantCrypto,
                        fiatCurrency: params[8],
                        receiveCurrency: params[10],
                        country: params[7],
                        fiatStringAmount: params[9],
                    };
                }

                await saveQuoteRequest(request);
                await saveCachedAccountInfo(
                    redirectParams.symbol,
                    redirectParams.accountType,
                    redirectParams.index,
                    true,
                );

                const accountItems = {
                    symbol: params[1],
                    accountIndex: params[3],
                    accountType: params[2],
                };

                // @ts-ignore TODO FIX THIS TS
                goto('wallet-coinmarket-buy', { ...accountItems });
            }
        };
        redirectWithQuotes();
    });

    return <Wrapper>Redirecting ...</Wrapper>;
};

export default CoinmarketRedirect;
