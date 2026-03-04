import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { Coins, CryptoId, InfoResponse, Platforms, type ProviderMetadata } from 'invity-api';

import { AccountKey, PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { CardanoOutput, FeeLevel, PROTO } from '@trezor/connect';

import {
    TradingPaymentMethodListProps,
    TradingTransaction,
    TradingType,
    TradingVerifiedAddress,
} from '../types';
import type { TradingOTC } from '../types';
import { TradingBuyState, buyInitialState } from './buyReducer';
import { TRADING_PREFIX } from '../constants';
import { TradingExchangeState, exchangeInitialState } from './exchangeReducer';
import { TradingSellState, sellInitialState } from './sellReducer';
import { TradingSettingsState, settingsInitialState } from './settingsReducer';

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
    otc?: TradingOTC;
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
        saveOtc(state, action: PayloadAction<TradingOTC | undefined>) {
            state.otc = action.payload;
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
    },
});

export const tradingCommonReducer = tradingCommonSlice.reducer;
export const tradingActions = tradingCommonSlice.actions;
