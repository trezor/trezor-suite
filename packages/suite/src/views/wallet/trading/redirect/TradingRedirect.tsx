import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import {
    type BuyCryptoPaymentMethod,
    type CryptoId,
    type SellCryptoPaymentMethod,
} from 'invity-api';
import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectRouter } from '@suite/router';
import { updateFeeInfoThunk } from '@suite-common/wallet-core';
import { type FeeLevel } from '@trezor/connect';
import { typography } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { useTradingRedirect } from 'src/hooks/wallet/useTradingRedirect';
import { type Account } from 'src/types/wallet';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
    ${typography['headline-sm']}
    height: 100%;
`;

export const TradingRedirect = () => {
    const {
        redirectToBuyOffers,
        redirectToBuyDetail,
        redirectToSellOffers,
        redirectToExchangeOffers,
    } = useTradingRedirect();
    const router = useSelector(selectRouter);

    const dispatch = useDispatch();

    useEffect(() => {
        // get rid of parameters appended by some partners to url which we pass to them
        const hashPart = router?.hash?.replace(/^#/, '').split('?')[0];
        const params = hashPart?.split('/');
        if (!params) return;

        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const indexParam: string = params[3];
        const redirectCommonParams = {
            routeType: params[0] as
                'detail' | 'offers' | 'sell-detail' | 'sell-offers' | 'exchange-offers',
            symbol: params[1] as Account['symbol'],
            accountType: params[2] as Account['accountType'],
            index: parseInt(indexParam, 10),
        };

        dispatch(updateFeeInfoThunk({ networkSymbol: redirectCommonParams.symbol }));

        if (redirectCommonParams.routeType === 'offers') {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const country: string = params[5];
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const fiatCurrency: string = params[6];
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const amount: string = params[7];
            redirectToBuyOffers({
                ...redirectCommonParams,
                wantCrypto: params[4] === 'qc',
                fiatCurrency,
                amount,
                receiveCurrency: params[8] as CryptoId,
                country,
                paymentMethod: params[9] as BuyCryptoPaymentMethod,
            });
        }

        if (redirectCommonParams.routeType === 'detail') {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const transactionId: string = params[4];
            redirectToBuyDetail({
                ...redirectCommonParams,
                transactionId,
            });
        }

        if (redirectCommonParams.routeType === 'sell-offers') {
            let feeIndex = 10;
            let orderId: string | undefined;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const sellOffersFlag: string = params[4];
            if (sellOffersFlag.startsWith('p-')) {
                feeIndex = 11;
                params[4] = sellOffersFlag.substring(2);

                orderId = params[10];
            }
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const country: string = params[5];
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const fiatCurrency: string = params[6];
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const amount: string = params[7];
            redirectToSellOffers({
                ...redirectCommonParams,
                amountInCrypto: params[4] === 'qc',
                fiatCurrency,
                amount,
                cryptoCurrency: params[8] as CryptoId,
                country,
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
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const amount: string = params[6];
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const orderId: string = params[7];
            redirectToExchangeOffers({
                ...redirectCommonParams,
                send: params[4] as CryptoId,
                receive: params[5] as CryptoId,
                amount,
                orderId,
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
        dispatch,
    ]);

    return (
        <Wrapper>
            <Translation id="TR_TRADE_REDIRECTING" />
        </Wrapper>
    );
};
