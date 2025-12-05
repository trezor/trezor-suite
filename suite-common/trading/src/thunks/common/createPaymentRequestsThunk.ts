import {
    CreateTradeSignatureRequestExchange,
    CreateTradeSignatureRequestSell,
    ExchangeTradeSigned,
    SellFiatTradeSigned,
} from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { Account, GeneralPrecomposedTransaction } from '@suite-common/wallet-types';
import { PROTO } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import { getNonce } from './getNonce';
import { getPaymentRequestOutputs } from './getPaymentRequestOutputs';
import { getPurchaseAddress } from './getPurchaseAddress';
import { getRefundAddress } from './getRefundAddress';
import { TRADING_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import {
    selectTradingCoinInfoByCryptoId,
    selectTradingCoinSymbolByCryptoId,
    selectTradingExchangeProviders,
    selectTradingExchangeReceiveAccountKey,
    selectTradingExchangeReceiveAddress,
    selectTradingExchangeSelectedQuote,
    selectTradingSellProviders,
    selectTradingSellSelectedQuote,
} from '../../selectors/tradingSelectors';
import { TradingSendRejectedProps, TradingTradeSellExchangeType } from '../../types';
import { cryptoIdToNetwork } from '../../utils';
import {
    tradingExchangeCreatePaymentRequest,
    tradingGetCoinSlip44,
    tradingSellCreatePaymentRequest,
} from '../../utils/signature/signatureUtils';

type CreateSignatureThunkProps = {
    type: TradingTradeSellExchangeType;
    account: Account;
    composedLevels: GeneralPrecomposedTransaction;
    formattedMaxAmount: string | undefined;
};

export const createPaymentRequestsThunk = createThunk<
    PROTO.PaymentRequest[],
    CreateSignatureThunkProps,
    {
        rejectValue: TradingSendRejectedProps;
    }
>(
    `${TRADING_THUNK_PREFIX}/createPaymentRequests`,
    async (
        { type, account, composedLevels, formattedMaxAmount },
        { dispatch, getState, fulfillWithValue, rejectWithValue },
    ) => {
        const { mac: macRefund, path: pathRefund } = await dispatch(
            getRefundAddress({ account }),
        ).unwrap();
        const nonce = await dispatch(getNonce()).unwrap();

        if (!('outputs' in composedLevels)) {
            return rejectWithValue({
                type: 'sign-tx-error',
                error: {
                    id: 'TR_PAYMENT_REQUESTS_ERROR',
                },
            });
        }

        switch (type) {
            case 'exchange': {
                const quote = selectTradingExchangeSelectedQuote(getState());
                const providers = selectTradingExchangeProviders(getState());
                const sendSlip44 = await tradingGetCoinSlip44(quote?.send);
                const receiveSlip44 = await tradingGetCoinSlip44(quote?.receive);
                const receiveDisplaySymbol = selectTradingCoinSymbolByCryptoId(
                    getState(),
                    quote?.receive,
                );

                const receiveAccountKey = selectTradingExchangeReceiveAccountKey(getState());
                const receiveAddress = selectTradingExchangeReceiveAddress(getState());
                const receiveAccount = selectAccountByKey(getState(), receiveAccountKey);
                const sendNetwork = quote?.send ? cryptoIdToNetwork(quote.send) : undefined;

                if (
                    !quote?.orderId ||
                    sendSlip44 === undefined ||
                    receiveSlip44 === undefined ||
                    receiveAddress === undefined ||
                    !receiveAccount ||
                    !receiveDisplaySymbol ||
                    !sendNetwork
                ) {
                    return rejectWithValue({
                        type: 'sign-tx-error',
                        error: {
                            id: 'TR_PAYMENT_REQUESTS_ERROR',
                        },
                    });
                }

                const { mac: macPurchase, path: pathPurchase } = await dispatch(
                    getPurchaseAddress({ account: receiveAccount, address: receiveAddress }),
                ).unwrap();

                const outputs = await dispatch(
                    getPaymentRequestOutputs({ network: sendNetwork, composedLevels }),
                ).unwrap();

                const trade = await invityAPI.getSignedTrade<
                    ExchangeTradeSigned,
                    CreateTradeSignatureRequestExchange
                >({
                    type: 'exchange',
                    id: quote.orderId,
                    nonce,
                    sendSlip44,
                    receiveSlip44,
                    outputs,
                });

                const provider = trade?.exchange ? providers?.[trade.exchange] : undefined;
                const sendStringAmount = formattedMaxAmount ?? trade?.sendStringAmount;

                if (!provider || !trade || !sendStringAmount) {
                    return rejectWithValue({
                        type: 'sign-tx-error',
                        error: {
                            id: 'TR_PAYMENT_REQUESTS_ERROR',
                        },
                    });
                }

                const paymentRequest = tradingExchangeCreatePaymentRequest({
                    trade,
                    provider,
                    macPurchase,
                    pathPurchase,
                    macRefund,
                    pathRefund,
                    nonce,
                    receiveSlip44,
                    receiveDisplaySymbol,
                    sendStringAmount,
                    sendTokenDecimals: composedLevels.token?.decimals,
                });

                if (!paymentRequest) {
                    return rejectWithValue({
                        type: 'sign-tx-error',
                        error: {
                            id: 'TR_PAYMENT_REQUESTS_ERROR',
                        },
                    });
                }

                return fulfillWithValue([paymentRequest]);
            }
            case 'sell': {
                const quote = selectTradingSellSelectedQuote(getState());
                const providers = selectTradingSellProviders(getState());
                const sendSlip44 = await tradingGetCoinSlip44(quote?.cryptoCurrency);

                if (!quote?.paymentId || sendSlip44 === undefined || !quote.cryptoCurrency) {
                    return rejectWithValue({
                        type: 'sign-tx-error',
                        error: {
                            id: 'TR_PAYMENT_REQUESTS_ERROR',
                        },
                    });
                }

                const sendNetwork = cryptoIdToNetwork(quote.cryptoCurrency);
                if (!sendNetwork) {
                    return rejectWithValue({
                        type: 'sign-tx-error',
                        error: {
                            id: 'TR_PAYMENT_REQUESTS_ERROR',
                        },
                    });
                }

                const cryptoSymbol = selectTradingCoinInfoByCryptoId(
                    getState(),
                    quote.cryptoCurrency,
                );

                // TODO: slip24 - will be changed soon
                const memoText = `Selling ${quote.cryptoStringAmount} ${cryptoSymbol?.symbol} for ${quote.fiatStringAmount} ${quote.fiatCurrency}`;

                const outputs = await dispatch(
                    getPaymentRequestOutputs({ network: sendNetwork, composedLevels }),
                ).unwrap();

                const trade = await invityAPI.getSignedTrade<
                    SellFiatTradeSigned,
                    CreateTradeSignatureRequestSell
                >({
                    type: 'sell',
                    id: quote.paymentId,
                    sendSlip44,
                    nonce,
                    outputs,
                    memoText,
                });

                const provider = trade?.exchange ? providers?.[trade.exchange] : undefined;
                const sendStringAmount = formattedMaxAmount ?? trade?.cryptoStringAmount;

                if (!provider || !trade || !sendStringAmount) {
                    return rejectWithValue({
                        type: 'sign-tx-error',
                        error: {
                            id: 'TR_PAYMENT_REQUESTS_ERROR',
                        },
                    });
                }

                const paymentRequest = tradingSellCreatePaymentRequest({
                    trade,
                    provider,
                    macRefund,
                    pathRefund,
                    nonce,
                    memoText,
                    sendStringAmount,
                    sendTokenDecimals: composedLevels.token?.decimals,
                });

                if (!paymentRequest) {
                    return rejectWithValue({
                        type: 'sign-tx-error',
                        error: {
                            id: 'TR_PAYMENT_REQUESTS_ERROR',
                        },
                    });
                }

                return fulfillWithValue([paymentRequest]);
            }

            default:
                throw exhaustive(type);
        }
    },
);
