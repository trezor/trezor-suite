import {
    CreateTradeSignatureRequestExchange,
    CreateTradeSignatureRequestSell,
    ExchangeTradeSigned,
    PaymentRequestOutput,
    SellFiatTradeSigned,
} from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { Account, GeneralPrecomposedTransaction } from '@suite-common/wallet-types';
import TrezorConnect, { PROTO } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import { getNonce } from './getNonce';
import { getRefundAddress } from './getRefundAddress';
import { TRADING_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import {
    selectTradingCoinInfoByCryptoId,
    selectTradingExchangeProviders,
    selectTradingExchangeSelectedQuote,
    selectTradingSellProviders,
    selectTradingSellSelectedQuote,
    selectTradingVerifiedAddress,
} from '../../selectors/tradingSelectors';
import { TradingSendRejectedProps, TradingTradeSellExchangeType } from '../../types';
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

        const outputs: PaymentRequestOutput[] = [];

        for (const output of composedLevels.outputs) {
            if ('address' in output && output.address) {
                outputs.push({
                    amount: output.amount.toString(),
                    address: output.address,
                });
            }

            if ('address_n' in output && output.address_n) {
                const getAddress = await TrezorConnect.getAddress({
                    path: output.address_n,
                    showOnTrezor: false,
                    keepSession: true,
                });

                if (getAddress.success) {
                    outputs.push({
                        amount: output.amount.toString(),
                        address: getAddress.payload.address,
                    });
                }
            }
        }

        switch (type) {
            case 'exchange': {
                const quote = selectTradingExchangeSelectedQuote(getState());
                const providers = selectTradingExchangeProviders(getState());
                const verifiedAddress = selectTradingVerifiedAddress(getState());
                const sendSlip44 = await tradingGetCoinSlip44(quote?.send);
                const receiveSlip44 = await tradingGetCoinSlip44(quote?.receive);

                if (
                    !quote?.orderId ||
                    !verifiedAddress?.mac ||
                    !verifiedAddress.path ||
                    sendSlip44 === undefined ||
                    receiveSlip44 === undefined
                ) {
                    return rejectWithValue({
                        type: 'sign-tx-error',
                        error: {
                            id: 'TR_PAYMENT_REQUESTS_ERROR',
                        },
                    });
                }

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

                if (!provider || !trade) {
                    return rejectWithValue({
                        type: 'sign-tx-error',
                        error: {
                            id: 'TR_PAYMENT_REQUESTS_ERROR',
                        },
                    });
                }

                const paymentRequest = tradingExchangeCreatePaymentRequest({
                    trade: {
                        ...trade,
                        sendStringAmount: formattedMaxAmount ?? trade.sendStringAmount,
                    },
                    provider,
                    macPurchase: verifiedAddress.mac,
                    pathPurchase: verifiedAddress.path,
                    macRefund,
                    pathRefund,
                    nonce,
                    receiveSlip44,
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

                if (!quote?.paymentId || sendSlip44 === undefined) {
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

                if (!provider || !trade) {
                    return rejectWithValue({
                        type: 'sign-tx-error',
                        error: {
                            id: 'TR_PAYMENT_REQUESTS_ERROR',
                        },
                    });
                }

                const paymentRequest = tradingSellCreatePaymentRequest({
                    trade: {
                        ...trade,
                        cryptoStringAmount: formattedMaxAmount ?? trade.cryptoStringAmount,
                    },
                    provider,
                    macRefund,
                    pathRefund,
                    nonce,
                    memoText,
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
