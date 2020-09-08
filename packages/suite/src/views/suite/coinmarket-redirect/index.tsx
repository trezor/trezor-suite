import React, { useEffect } from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
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
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.BIG};
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
            accountType: params[2] as Account['accountType'],
            index: parseInt(params[3], 10),
        };

        const redirectWithQuotes = async () => {
            if (redirectParams.routeType === 'offers') {
                const wantCrypto = params[4] === 'qc';
                let request: BuyTradeQuoteRequest;
                const commonParams = {
                    fiatCurrency: params[6],
                    receiveCurrency: params[8],
                    country: params[5],
                };

                if (wantCrypto) {
                    request = {
                        ...commonParams,
                        wantCrypto,
                        cryptoStringAmount: params[7],
                    };
                } else {
                    request = {
                        ...commonParams,
                        wantCrypto,
                        fiatStringAmount: params[7],
                    };
                }
                await saveQuoteRequest(request);
                await saveCachedAccountInfo(
                    redirectParams.symbol,
                    redirectParams.index,
                    redirectParams.accountType,
                    true,
                );

                goto('wallet-coinmarket-buy', {
                    symbol: redirectParams.symbol,
                    accountIndex: redirectParams.index,
                    accountType: redirectParams.accountType,
                });
            }
        };
        redirectWithQuotes();
    });

    return <Wrapper>Redirecting ...</Wrapper>;
};

export default CoinmarketRedirect;
