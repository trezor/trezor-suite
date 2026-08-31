import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import {
    type Coins,
    type CryptoId,
    type InfoResponse,
    type Platforms,
    type ProviderMetadata,
} from 'invity-api';

import { type AccountKey, type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { type CardanoOutput, type FeeLevel, type PROTO } from '@trezor/connect';

import { type TradingTransaction, type TradingType, type TradingVerifiedAddress } from '../types';
import { type TradingBuyState, buyInitialState } from './buyReducer';
import { TRADING_PREFIX } from '../constants';
import { type TradingExchangeState, exchangeInitialState } from './exchangeReducer';
import { type TradingSellState, sellInitialState } from './sellReducer';

type TradingComposedTransactionInfoOutputs = {
    outputs?: PROTO.TxOutputType[] | CardanoOutput[];
};

export interface TradingComposedTransactionInfo {
    composed?: Pick<
        PrecomposedTransactionFinal,
        | 'fee'
        | 'feePerByte'
        | 'feeLimit'
        | 'estimatedFeeLimit'
        | 'maxFeePerGas'
        | 'maxPriorityFeePerGas'
        | 'token'
    > &
        TradingComposedTransactionInfoOutputs;
    selectedFee?: FeeLevel['label'];
}

export interface TradingInfo {
    platforms?: Platforms;
    coins?: Coins;
    config?: InfoResponse['config'];
}

export interface TradingPrefilledFromAccount {
    cryptoId: CryptoId | undefined;
    key: AccountKey | undefined;
}

// Maximum number of refetch attempts before the interval automatically stops
export const REFETCH_QUOTES_MAX_COUNT = 40;

export interface QuoteRefetchingState {
    remainingRefetches: number;
    lastFetchTimestamp: number | undefined;
    status: 'running' | 'stopped';
}

export interface TradingState {
    info: TradingInfo;
    buy: TradingBuyState;
    exchange: TradingExchangeState;
    sell: TradingSellState;
    composedTransactionInfo: TradingComposedTransactionInfo;
    trades: TradingTransaction[];
    modalCryptoId: CryptoId | undefined;
    modalAccountKey: AccountKey | undefined;
    isLoading: boolean;
    lastLoadedTimestamp: number;
    activeSection: TradingType;
    prefilledFromAccount: TradingPrefilledFromAccount;
    verifiedAddress: TradingVerifiedAddress;
    currentProviderMetadata?: ProviderMetadata;
    quoteRefetchingState: QuoteRefetchingState;
}

export type TradingRootState = {
    wallet: {
        trading: TradingState;
    };
};

export const initialState: TradingState = {
    info: {
        platforms: undefined,
        coins: undefined,
    },
    buy: buyInitialState,
    exchange: exchangeInitialState,
    sell: sellInitialState,
    composedTransactionInfo: {},
    trades: [],
    isLoading: false,
    modalAccountKey: undefined,
    modalCryptoId: undefined,
    lastLoadedTimestamp: 0,
    activeSection: 'buy',
    prefilledFromAccount: {
        cryptoId: undefined,
        key: undefined,
    },
    verifiedAddress: undefined,
    quoteRefetchingState: {
        remainingRefetches: REFETCH_QUOTES_MAX_COUNT,
        lastFetchTimestamp: undefined,
        status: 'stopped',
    },
};

const tradingCommonSlice = createSlice({
    name: TRADING_PREFIX,
    initialState,
    reducers: {
        saveInfo(state: TradingState, action: PayloadAction<InfoResponse>) {
            state.info.coins = action.payload.coins;
            state.info.platforms = action.payload.platforms;
            state.info.config = action.payload.config;
        },
        saveComposedTransactionInfo(
            state: TradingState,
            action: PayloadAction<TradingComposedTransactionInfo>,
        ) {
            state.composedTransactionInfo = action.payload;
        },

        saveTrade(state: TradingState, action: PayloadAction<TradingTransaction>) {
            if (action.payload.key) {
                const trades = state.trades.filter(t => t.key !== action.payload.key);
                trades.push(action.payload);

                state.trades = trades;
            }
        },
        setModalCryptoCurrency(state: TradingState, action: PayloadAction<CryptoId | undefined>) {
            state.modalCryptoId = action.payload;
        },
        setModalAccountKey(state: TradingState, action: PayloadAction<AccountKey | undefined>) {
            state.modalAccountKey = action.payload;
        },
        setLoading(
            state: TradingState,
            action: PayloadAction<{ isLoading: boolean; lastLoadedTimestamp?: number }>,
        ) {
            state.isLoading = action.payload.isLoading;
            state.lastLoadedTimestamp = action.payload.lastLoadedTimestamp ?? 0;
        },
        setTradingActiveSection(state: TradingState, action: PayloadAction<TradingType>) {
            state.activeSection = action.payload;
        },
        setTradingFromPrefilledAccount(
            state: TradingState,
            action: PayloadAction<{
                cryptoId: CryptoId | undefined;
                key: AccountKey | undefined;
            }>,
        ) {
            state.prefilledFromAccount.cryptoId = action.payload.cryptoId;
            state.prefilledFromAccount.key = action.payload.key;
        },
        setVerifiedAddress(state: TradingState, action: PayloadAction<TradingVerifiedAddress>) {
            state.verifiedAddress = action.payload;
        },
        setCurrentProviderMetadata: (
            state: TradingState,
            { payload }: PayloadAction<ProviderMetadata | undefined>,
        ) => {
            state.currentProviderMetadata = payload;
        },
        stopRefetchQuotes: (state: TradingState) => {
            state.quoteRefetchingState.status = 'stopped';
            state.quoteRefetchingState.remainingRefetches = REFETCH_QUOTES_MAX_COUNT;
            state.quoteRefetchingState.lastFetchTimestamp = undefined;
        },
        setRefetchQuotesTimestamp: (
            state: TradingState,
            { payload }: PayloadAction<QuoteRefetchingState['lastFetchTimestamp']>,
        ) => {
            state.quoteRefetchingState.remainingRefetches -= 1;
            state.quoteRefetchingState.status =
                state.quoteRefetchingState.remainingRefetches <= 0 ? 'stopped' : 'running';
            state.quoteRefetchingState.lastFetchTimestamp = payload;
        },
    },
});

export const tradingCommonReducer = tradingCommonSlice.reducer;
export const tradingActions = tradingCommonSlice.actions;
