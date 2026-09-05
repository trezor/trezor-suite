import type {
    ExchangeProviderInfo,
    ExchangeTrade,
    SellFiatTrade,
    SellProviderInfo,
} from 'invity-api';

import {
    cryptoIdToNetworkAndContractAddress,
    getTradingFormState,
    isExchangeTrade,
    isSellFiatTrade,
    normalizeDexTransactionData,
} from '@suite-common/trading';
import { type NetworkType } from '@suite-common/wallet-config';
import { ETHEREUM_ADJUST_GAS_LIMIT } from '@suite-common/wallet-core';
import { type AccountKey, type FormState, type FormStateTrading } from '@suite-common/wallet-types';
import { QuoteError } from '@suite-native/trading-quote-utils';
import { type FeeLevel } from '@trezor/connect';

interface CreateFormStateForSendFormParams {
    quote: ExchangeTrade | SellFiatTrade;
    providers: Record<string, ExchangeProviderInfo> | { [name: string]: SellProviderInfo };
    feeLevel?: Pick<
        FeeLevel,
        'label' | 'feePerUnit' | 'feeLimit' | 'maxPriorityFeePerGas' | 'maxFeePerGas'
    >;
    extraField?: string;
    isSlip24Active?: boolean;
    networkType: NetworkType;
    sendAccountKey: AccountKey | undefined;
    receiveAccountKey?: AccountKey | undefined;
}

/**
 * Creates a FormState for transactions from exchange or sell quotes
 */
export const createFormStateForSendForm = ({
    quote,
    providers,
    feeLevel = { label: 'normal', feePerUnit: '' },
    extraField,
    isSlip24Active = false,
    networkType,
    sendAccountKey,
    receiveAccountKey,
}: CreateFormStateForSendFormParams): FormState => {
    if (!isExchangeTrade(quote) && !isSellFiatTrade(quote)) {
        throw new QuoteError('Invalid quote type: must be ExchangeTrade or SellFiatTrade', quote);
    }

    let outputAddress: string;
    let outputAmount: string;
    let sendTokenContract: string | undefined;
    let transactionData = '';
    let ethereumAdjustGasLimit = '';

    // Handle extra field for networks that require it (e.g., destinationTag for XRP)
    let destinationTag: string | undefined;
    let tradingFormState: FormStateTrading;

    if (extraField) {
        destinationTag = extraField;
    }

    if (isExchangeTrade(quote)) {
        // Exchange quote (swap)
        const exchangeQuote = quote;
        const exchangeProviders = providers as Record<string, ExchangeProviderInfo>;
        outputAddress = exchangeQuote.sendAddress || '';
        outputAmount = exchangeQuote.sendStringAmount || '';

        // DEX quotes carry transaction data for correct fee estimation
        if (exchangeQuote.isDex && exchangeQuote.dexTx) {
            outputAddress = exchangeQuote.dexTx.to;
            transactionData = normalizeDexTransactionData({
                data: exchangeQuote.dexTx.data,
                networkType,
            });
            ethereumAdjustGasLimit = ETHEREUM_ADJUST_GAS_LIMIT;
        }

        if (exchangeQuote.send) {
            const { contractAddress } = cryptoIdToNetworkAndContractAddress(exchangeQuote.send);
            sendTokenContract = contractAddress;
        }
        if (!destinationTag) {
            destinationTag = exchangeQuote.partnerPaymentExtraId;
        }
        tradingFormState = getTradingFormState({
            activeSection: 'exchange',
            providers: exchangeProviders,
            trade: exchangeQuote,
            isSlip24Active,
            sendAccountKey,
            receiveAccountKey,
        });
    } else {
        // Sell quote (crypto to fiat)
        const sellQuote = quote;
        const sellProviders = providers as Record<string, SellProviderInfo>;
        outputAddress = sellQuote.destinationAddress || '';
        outputAmount = sellQuote.cryptoStringAmount || '';
        if (sellQuote.cryptoCurrency) {
            const { contractAddress } = cryptoIdToNetworkAndContractAddress(
                sellQuote.cryptoCurrency,
            );
            sendTokenContract = contractAddress;
        }

        if (!destinationTag) {
            destinationTag = sellQuote.destinationPaymentExtraId;
        }
        tradingFormState = getTradingFormState({
            activeSection: 'sell',
            providers: sellProviders,
            trade: sellQuote,
            isSlip24Active,
            sendAccountKey,
            receiveAccountKey,
        });
    }
    const formState: FormState = {
        outputs: [
            {
                type: 'payment',
                address: outputAddress,
                amount: outputAmount,
                fiat: '',
                currency: { label: '', value: '' },
                label: '',
                token: sendTokenContract ?? null,
            },
        ],
        setMaxOutputId: undefined,
        selectedFee: feeLevel.label,
        feePerUnit: feeLevel.feePerUnit || '',
        maxPriorityFeePerGas: feeLevel?.maxPriorityFeePerGas || '',
        maxFeePerGas: feeLevel?.maxFeePerGas || '',
        feeLimit: feeLevel.feeLimit || '',
        estimatedFeeLimit: '',
        baseFee: undefined,
        options: ['broadcast'],
        bitcoinLocktimeBlockHeight: '',
        bitcoinLocktimeDatetime: '',
        ethereumNonce: '',
        ethereumAdjustGasLimit,
        transactionData,
        destinationTag,
        rbfParams: undefined,
        isCoinControlEnabled: false,
        hasCoinControlBeenOpened: false,
        anonymityWarningChecked: undefined,
        selectedUtxos: [],
        utxoSorting: 'newestFirst',
        trading: tradingFormState,
    };

    return formState;
};
