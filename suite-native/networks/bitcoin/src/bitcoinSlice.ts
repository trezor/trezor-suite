import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

export type BitcoinState = {
    sendForm: {
        address: string;
        feeRate: string;
    };
};

export type BitcoinRootState = {
    nativeNetworks: {
        bitcoin: BitcoinState;
    };
};

export const bitcoinInitialState: BitcoinState = {
    sendForm: {
        address: '',
        feeRate: '5',
    },
};

const bitcoinSlice = createSlice({
    name: 'bitcoin',
    initialState: bitcoinInitialState,
    reducers: {
        setSendFormAddress(state: BitcoinState, action: PayloadAction<string>) {
            state.sendForm.address = action.payload;
        },
        setSendFormFeeRate(state: BitcoinState, action: PayloadAction<string>) {
            state.sendForm.feeRate = action.payload;
        },
    },
});

export const selectBitcoinSendFormAddress = (state: BitcoinRootState) =>
    state.nativeNetworks.bitcoin.sendForm.address;
export const selectBitcoinSendFormFeeRate = (state: BitcoinRootState) =>
    state.nativeNetworks.bitcoin.sendForm.feeRate;

export const bitcoinActions = bitcoinSlice.actions;
export const bitcoinReducer = bitcoinSlice.reducer;
