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

import {
    type TradingPaymentMethodListProps,
    type TradingTransaction,
    type TradingType,
    type TradingVerifiedAddress,
} from '../types';
import { type TradingBuyState, buyInitialState } from './buyReducer';
import { TRADING_PREFIX } from '../constants';
import { type TradingExchangeState, exchangeInitialState } from './exchangeReducer';
import { type TradingSellState, sellInitialState } from './sellReducer';
import { type TradingSettingsState, settingsInitialState } from './settingsReducer';

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
    paymentMethods: TradingPaymentMethodListProps[];
}

export interface TradingPrefilledFromAccount {
    cryptoId: CryptoId | undefined;
    key: AccountKey | undefined;
}

export type QuotesTimerStatus =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'stopped' }
    | { status: 'running'; fetchedAt: number };

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
    settings: TradingSettingsState;
    currentProviderMetadata?: ProviderMetadata;
    favouriteAssets: Record<CryptoId, true>;
    quotesTimer: QuotesTimerStatus;
    fetchCount: number;
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
        paymentMethods: [],
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
    settings: settingsInitialState,
    favouriteAssets: {},
    quotesTimer: { status: 'idle' },
    fetchCount: 0,
};

const tradingCommonSlice = createSlice({
    name: TRADING_PREFIX,
    initialState,
    reducers: {
        addTradeableAssetToFavourites: (state, { payload }: PayloadAction<CryptoId>) => {
            if (!state.favouriteAssets) {
                state.favouriteAssets = {};
            }
            state.favouriteAssets[payload] = true;
        },
        removeTradeableAssetFromFavourites: (state, { payload }: PayloadAction<CryptoId>) => {
            if (state.favouriteAssets) {
                delete state.favouriteAssets[payload];
            }
        },
        saveInfo(state, action: PayloadAction<InfoResponse>) {
            state.info.coins = action.payload.coins;
            state.info.platforms = action.payload.platforms;
        },
        savePaymentMethods(state, action: PayloadAction<TradingPaymentMethodListProps[]>) {
            state.info.paymentMethods = action.payload;
        },
        saveComposedTransactionInfo(state, action: PayloadAction<TradingComposedTransactionInfo>) {
            state.composedTransactionInfo = action.payload;
        },

        saveTrade(state, action: PayloadAction<TradingTransaction>) {
            if (action.payload.key) {
                const trades = state.trades.filter(t => t.key !== action.payload.key);
                trades.push(action.payload);

                state.trades = trades;
            }
        },
        setModalCryptoCurrency(state, action: PayloadAction<CryptoId | undefined>) {
            state.modalCryptoId = action.payload;
        },
        setModalAccountKey(state, action: PayloadAction<AccountKey | undefined>) {
            state.modalAccountKey = action.payload;
        },
        setLoading(
            state,
            action: PayloadAction<{ isLoading: boolean; lastLoadedTimestamp?: number }>,
        ) {
            state.isLoading = action.payload.isLoading;
            state.lastLoadedTimestamp = action.payload.lastLoadedTimestamp ?? 0;
        },
        setTradingActiveSection(state, action: PayloadAction<TradingType>) {
            state.activeSection = action.payload;
        },
        setTradingFromPrefilledAccount(
            state,
            action: PayloadAction<{
                cryptoId: CryptoId | undefined;
                key: AccountKey | undefined;
            }>,
        ) {
            state.prefilledFromAccount.cryptoId = action.payload.cryptoId;
            state.prefilledFromAccount.key = action.payload.key;
        },
        setVerifiedAddress(state, action: PayloadAction<TradingVerifiedAddress>) {
            state.verifiedAddress = action.payload;
        },
        setCurrentProviderMetadata: (
            state,
            { payload }: PayloadAction<ProviderMetadata | undefined>,
        ) => {
            state.currentProviderMetadata = payload;
        },
        setQuotesTimer(state, action: PayloadAction<QuotesTimerStatus>) {
            state.quotesTimer = action.payload;
        },
        incrementFetchCount(state) {
            state.fetchCount += 1;
        },
        resetQuotesTimer(state) {
            state.quotesTimer = { status: 'idle' };
            state.fetchCount = 0;
        },
    },
});

export const tradingCommonReducer = tradingCommonSlice.reducer;
export const tradingActions = tradingCommonSlice.actions;
