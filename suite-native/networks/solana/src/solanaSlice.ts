import { createSlice } from '@reduxjs/toolkit';

export type SolanaState = {
    isLimitedHistoryBannerClosed: boolean;
};

export type SolanaRootState = {
    nativeNetworks: {
        solana: SolanaState;
    };
};

export const solanaInitialState: SolanaState = {
    isLimitedHistoryBannerClosed: false,
};

const solanaSlice = createSlice({
    name: 'solana',
    initialState: solanaInitialState,
    reducers: {
        closeLimitedHistoryBanner(state: SolanaState) {
            state.isLimitedHistoryBannerClosed = true;
        },
    },
});

export const selectIsSolanaLimitedHistoryBannerClosed = (state: SolanaRootState) =>
    state.nativeNetworks.solana.isLimitedHistoryBannerClosed;

export const { closeLimitedHistoryBanner } = solanaSlice.actions;
export const solanaReducer = solanaSlice.reducer;
