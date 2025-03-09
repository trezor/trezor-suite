import { useEffect } from 'react';

import { BuyCryptoPaymentMethod, CryptoId, SellCryptoPaymentMethod } from 'invity-api';
import styled from 'styled-components';

import { variables } from '@trezor/components';
import { FeeLevel } from '@trezor/connect';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useTradingRedirect } from 'src/hooks/wallet/useTradingRedirect';
import { Account } from 'src/types/wallet';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.BIG};
    height: 100%;
`;

export const TradingRedirect = () => {
    const {
        redirectToBuyOffers,
        redirectToBuyDetail,
        redirectToSellOffers,
        redirectToExchangeOffers,
    } = useTradingRedirect();
    const router = useSelector(state => state.router);

    useEffect(() => {
        // get rid of parameters appended by some partners to url which we pass to them
        const params = router?.hash?.split('?')[0].split('/');
        if (!params) return;

        const redirectCommonParams = {
            routeType: params[0] as
                | 'detail'
                | 'offers'
                | 'sell-detail'
                | 'sell-offers'
                | 'exchange-offers',
            symbol: params[1] as Account['symbol'],
            accountType: params[2] as Account['accountType'],
            index: parseInt(params[3], 10),
        };

        if (redirectCommonParams.routeType === 'offers') {
            redirectToBuyOffers({
                ...redirectCommonParams,
                wantCrypto: params[4] === 'qc',
                fiatCurrency: params[6],
                amount: params[7],
                receiveCurrency: params[8] as CryptoId,
                country: params[5],
                paymentMethod: params[9] as BuyCryptoPaymentMethod,
            });
        }

        if (redirectCommonParams.routeType === 'detail') {
            redirectToBuyDetail({ ...redirectCommonParams, transactionId: params[4] });
        }

        if (redirectCommonParams.routeType === 'sell-offers') {
            let feeIndex = 10;
            let orderId: string | undefined;
            if (params[4].startsWith('p-')) {
                feeIndex = 11;
                params[4] = params[4].substring(2);

                orderId = params[10];
            }
            redirectToSellOffers({
                ...redirectCommonParams,
                amountInCrypto: params[4] === 'qc',
                fiatCurrency: params[6],
                amount: params[7],
                cryptoCurrency: params[8] as CryptoId,
                country: params[5],
                paymentMethod: params[9] as SellCryptoPaymentMethod,
                orderId,
                selectedFee: params[feeIndex] as FeeLevel['label'],
                feePerByte: params[feeIndex + 1],
                maxFeePerGas: params[feeIndex + 2],
                maxPriorityFeePerGas: params[feeIndex + 3],
                feeLimit: params[feeIndex + 4],
            });
        }

        if (redirectCommonParams.routeType === 'exchange-offers') {
            const feeIndex = 8;
            redirectToExchangeOffers({
                ...redirectCommonParams,
                send: params[4] as CryptoId,
                receive: params[5] as CryptoId,
                amount: params[6],
                orderId: params[7],
                selectedFee: params[feeIndex] as FeeLevel['label'],
                feePerByte: params[feeIndex + 1],
                maxFeePerGas: params[feeIndex + 2],
                maxPriorityFeePerGas: params[feeIndex + 3],
                feeLimit: params[feeIndex + 4],
            });
        }
    }, [
        redirectToBuyOffers,
        redirectToBuyDetail,
        redirectToSellOffers,
        redirectToExchangeOffers,
        router,
    ]);

    return (
        <Wrapper>
            <Translation id="TR_TRADE_REDIRECTING" />
        </Wrapper>
    );
};
