import { useEffect } from 'react';
import styled from 'styled-components';
import { useSelector } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';
import { variables } from '@trezor/components';
import { useCoinmarketRedirect } from 'src/hooks/wallet/useCoinmarketRedirect';
import { Translation } from 'src/components/suite';
import { FeeLevel } from '@trezor/connect';
import { CryptoSymbol } from 'invity-api';

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
    const { redirectToOffers, redirectToDetail, redirectToSellOffers } = useCoinmarketRedirect();
    const router = useSelector(state => state.router);

    useEffect(() => {
        // get rid of parameters appended by some partners to url which we pass to them
        const params = router?.hash?.split('?')[0].split('/');
        if (!params) return;

        const redirectCommonParams = {
            routeType: params[0] as 'detail' | 'offers' | 'sell-offers',
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
                receiveCurrency: params[8] as CryptoSymbol,
                country: params[5],
            });
        }

        if (redirectCommonParams.routeType === 'sell-offers') {
            let feeIndex = 9;
            let orderId: string | undefined;
            if (params[4].startsWith('p-')) {
                feeIndex = 10;
                params[4] = params[4].substring(2);
                // eslint-disable-next-line prefer-destructuring
                orderId = params[9];
            }
            redirectToSellOffers({
                ...redirectCommonParams,
                amountInCrypto: params[4] === 'qc',
                fiatCurrency: params[6],
                amount: params[7],
                cryptoCurrency: params[8] as CryptoSymbol,
                country: params[5],
                orderId,
                selectedFee: params[feeIndex] as FeeLevel['label'],
                feePerByte: params[feeIndex + 1],
                feeLimit: params[feeIndex + 2],
            });
        }

        if (redirectCommonParams.routeType === 'detail') {
            redirectToDetail({ ...redirectCommonParams, transactionId: params[4] });
        }
    }, [redirectToOffers, redirectToDetail, redirectToSellOffers, router]);

    return (
        <Wrapper>
            <Translation id="TR_TRADE_REDIRECTING" />
        </Wrapper>
    );
};

export default CoinmarketRedirect;
