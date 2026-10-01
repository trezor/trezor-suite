import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

export type SolanaState = {
    isLimitedHistoryBannerClosed: boolean;
    sendForm: {
        address: string;
        priorityFee: number;
    };
};

export type SolanaRootState = {
    nativeNetworks: {
        solana: SolanaState;
    };
};

export const solanaInitialState: SolanaState = {
    isLimitedHistoryBannerClosed: false,
    sendForm: {
        address: '',
        priorityFee: 1000,
    },
};

const solanaSlice = createSlice({
    name: 'solana',
    initialState: solanaInitialState,
    reducers: {
        setSendFormAddress(state: SolanaState, action: PayloadAction<string>) {
            state.sendForm.address = action.payload;
        },
        setSendFormPriorityFee(state: SolanaState, action: PayloadAction<number>) {
            state.sendForm.priorityFee = action.payload;
        },
        closeLimitedHistoryBanner(state: SolanaState) {
            state.isLimitedHistoryBannerClosed = true;
        },
    },
});

export const selectIsSolanaLimitedHistoryBannerClosed = (state: SolanaRootState) =>
    state.nativeNetworks.solana.isLimitedHistoryBannerClosed;

export const selectSolanaSendFormAddress = (state: SolanaRootState) =>
    state.nativeNetworks.solana.sendForm.address;
export const selectSolanaSendFormPriorityFee = (state: SolanaRootState) =>
    state.nativeNetworks.solana.sendForm.priorityFee;

export const solanaActions = solanaSlice.actions;
export const { closeLimitedHistoryBanner } = solanaActions;
export const solanaReducer = solanaSlice.reducer;
