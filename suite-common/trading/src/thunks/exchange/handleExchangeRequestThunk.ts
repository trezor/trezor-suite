import { type ExchangeTrade, type ExchangeTradeQuoteRequest } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { type Network } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import {
    asAmountUnit,
    convertAmountSubunitsToUnits,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { getSerializedPath } from '@trezor/connect/src/utils/pathUtils';

import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { selectTradingCoinSymbolByCryptoId } from '../../selectors/tradingSelectors';
import {
    type HandleExchangeRequestThunkProps,
    type MinimalExchangeFormProps,
    type TradingExchangeType,
} from '../../types';
import { addIdsToQuotes, getNetworkDecimalsWithFallback } from '../../utils';
import { exchangeUtils } from '../../utils/exchange/exchangeUtils';

type GetQuotesRequest = {
    requestData: ExchangeTradeQuoteRequest;
    signal: AbortSignal | null;
};

const getQuotesRequest = ({ requestData, signal }: GetQuotesRequest) =>
    invityAPI.getExchangeQuotes(requestData, signal);

type GetQuoteRequestData = {
    formValues: MinimalExchangeFormProps;
    network: Network;
    account: Account;
    shouldSendInSats: boolean | undefined;
};

const getQuoteRequestData = async ({
    formValues,
    network,
    account,
    shouldSendInSats,
}: GetQuoteRequestData): Promise<ExchangeTradeQuoteRequest | undefined> => {
    const { outputs, receiveCryptoSelect, sendCryptoSelect, receiveAddress } = formValues;
    const decimals = getNetworkDecimalsWithFallback(network.symbol);

    const unformattedOutputAmount = outputs[0].amount ?? '';
    const sendStringAmount =
        unformattedOutputAmount && shouldSendInSats
            ? convertAmountSubunitsToUnits(unformattedOutputAmount, decimals)
            : unformattedOutputAmount;

    if (
        !receiveCryptoSelect?.id ||
        !sendCryptoSelect?.id ||
        !sendStringAmount ||
        Number(sendStringAmount) === 0
    ) {
        return undefined;
    }

    let { fromAddress } = formValues;

    if (network.networkType === 'bitcoin') {
        if (!account.addresses || !account.utxo) {
            return undefined;
        }

        const usedAddressSet = new Set([
            ...account.addresses.used.map(a => a.address),
            ...account.addresses.change.map(a => a.address),
        ]);
        const usedUtxo = account.utxo.filter(u => usedAddressSet.has(u.address));

        if (usedUtxo.length === 0) {
            return undefined;
        }

        const amountSubunit = unitsToSubunits({
            value: asAmountUnit(new BigNumber(sendStringAmount)),
            decimals,
        });
        // TODO: move the values somewhere else
        const composeParams: Parameters<typeof TrezorConnect.composeTransaction>[0] = {
            outputs: [
                {
                    type: 'opreturn',
                    dataHex:
                        '3078306632656166663639313734646264333963366533346661366465653966326266626566663363313139366462303666636238356339313364376531663466643d7c6c6966696351',
                },
                { type: 'payment-noaddress', amount: amountSubunit.toString() },
                {
                    type: 'payment',
                    amount: '2000',
                    address: 'bc1qrxm8l37stwxhpkh5sfmt2lvpf5g292x2w60pe7', // partner fee
                },
                {
                    type: 'payment',
                    amount: '2000',
                    address: 'bc1qrxm8l37stwxhpkh5sfmt2lvpf5g292x2w60pe7', // our fee
                },
            ],
            coin: network.symbol,
            account: {
                path: account.path,
                addresses: account.addresses,
                utxo: usedUtxo,
            },
            feeLevels: [{ feePerUnit: '1' }],
        };

        const precomposed = await TrezorConnect.composeTransaction(composeParams);
        console.log('precomposed', precomposed);

        if (precomposed.success && precomposed.payload.length > 0) {
            const tx = precomposed.payload[0];
            if (tx.type === 'final' || tx.type === 'nonfinal') {
                const addresses = await Promise.all(
                    tx.inputs.map(async (i: any) => {
                        const path = getSerializedPath(i.address_n);

                        return usedUtxo.find(a => a.path === path)?.address;
                    }),
                );
                // TODO: change to array of addresses
                fromAddress = Array.from(new Set(addresses)).join(';');
            }
        }
    }

    const request: ExchangeTradeQuoteRequest = {
        receive: receiveCryptoSelect.id,
        send: sendCryptoSelect.id,
        sendStringAmount,
        dex: 'enable',
        receiveAddress,
        fromAddress,
    };

    return request;
};

export const handleExchangeRequestThunk = createThunk<
    ExchangeTrade[],
    HandleExchangeRequestThunkProps,
    {
        rejectValue: string;
    }
>(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/handleRequest`,
    async (
        {
            formValues,
            network,
            account,
            timer,
            shouldSendInSats,
            composeRequestCallback,
        }: HandleExchangeRequestThunkProps,
        { dispatch, getState, fulfillWithValue, rejectWithValue, signal },
    ) => {
        timer.loading();

        const requestData = await getQuoteRequestData({
            formValues,
            network,
            account,
            shouldSendInSats,
        });

        if (!requestData) {
            timer.stop();

            return rejectWithValue('Invalid request data');
        }

        const allQuotes = await getQuotesRequest({ requestData, signal });

        if (signal.aborted) {
            timer.reset();

            return rejectWithValue('Request was aborted');
        }

        if (!Array.isArray(allQuotes) || allQuotes.length === 0) {
            timer.stop();
            dispatch(tradingExchangeActions.saveQuotes([]));

            return fulfillWithValue([]);
        }

        const currency =
            selectTradingCoinSymbolByCryptoId(getState(), requestData.send) ?? requestData.send;
        const limits = exchangeUtils.getAmountLimits({ quotes: allQuotes, currency });

        const successQuotes = addIdsToQuotes<TradingExchangeType>(
            exchangeUtils.getSuccessQuotesOrdered(allQuotes),
            'exchange',
        );

        dispatch(tradingExchangeActions.setAmountLimits(limits));
        dispatch(tradingExchangeActions.saveQuotes(successQuotes));
        dispatch(tradingExchangeActions.saveQuoteRequest(requestData));

        const { setMaxOutputId } = formValues;

        // compose transaction only when is not computed from max balance
        // max balance has to be computed before request
        const shouldComposeRequest = setMaxOutputId === undefined && !limits;

        if (shouldComposeRequest) {
            composeRequestCallback();
        }

        timer.reset();

        return fulfillWithValue(successQuotes);
    },
);
