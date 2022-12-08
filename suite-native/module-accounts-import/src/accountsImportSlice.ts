import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { networks } from '@suite-common/wallet-config';

import { AssetItem } from './components/SelectableAssetList';

export const actionPrefix = '@accountsImport';

export type AccountsImportState = {
    selectedCoin: AssetItem;
};

export type AccountsImportRootState = {
    accountsImport: AccountsImportState;
};

const initialState: AccountsImportState = {
    selectedCoin: {
        cryptoCurrencySymbol: 'btc',
        cryptoCurrencyName: networks.btc.name,
        iconName: 'btc',
    },
};

const accountsImportSlice = createSlice({
    name: actionPrefix,
    initialState,
    reducers: {
        updateSelectedCoin: (state, action: PayloadAction<AssetItem>) => {
            state.selectedCoin = action.payload;
        },
    },
});

export const selectSelectedCoin = (state: AccountsImportRootState) =>
    state.accountsImport.selectedCoin;

export const { updateSelectedCoin } = accountsImportSlice.actions;
export const accountsImportReducer = accountsImportSlice.reducer;
