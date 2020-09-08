import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useSelector } from '@suite/hooks/suite';
import { Account } from '@wallet-types';
import { variables } from '@trezor/components';
import { useRedirect } from '@suite-hooks/useRedirect';

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
    const { redirectToOffers, redirectToDetail } = useRedirect();
    const router = useSelector(state => state.router);

    useEffect(() => {
        const params = router?.hash?.split('/');
        if (!params) return;

        const redirectCommonParams = {
            routeType: params[0] as 'detail' | 'offers',
            symbol: params[1] as Account['symbol'],
            accountType: params[2] as Account['accountType'],
            index: parseInt(params[3], 10),
        };

        if (redirectCommonParams.routeType === 'offers') {
            redirectToOffers({
                ...redirectCommonParams,
                wantCrypto: params[4] === 'qc',
                fiatCurrency: params[6],
                amount: params[7],
                receiveCurrency: params[8],
                country: params[5],
            });
        }

        if (redirectCommonParams.routeType === 'detail') {
            redirectToDetail({ ...redirectCommonParams, transactionId: params[4] });
        }
    });

    return <Wrapper>Redirecting ...</Wrapper>;
};

export default CoinmarketRedirect;
