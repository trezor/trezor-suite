import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

export type AssetTableState = {
    isNewBannerDismissed: boolean;
};

type StorageLoadAssetTableAction = PayloadAction<{
    assetTable?: AssetTableState;
}>;

export const assetTableInitialState: AssetTableState = {
    isNewBannerDismissed: false,
};

const assetTableSlice = createSlice({
    name: 'assetTable',
    initialState: assetTableInitialState,
    reducers: {
        dismissNewBanner: state => {
            state.isNewBannerDismissed = true;
        },
    },
    extraReducers: builder => {
        builder.addCase('@storage/load', (state, action) => {
            const { payload } = action as StorageLoadAssetTableAction;

            return payload?.assetTable ? { ...state, ...payload.assetTable } : state;
        });
    },
});

export type AssetTableRootState = {
    assetTable: AssetTableState;
};

export const assetTableActions = assetTableSlice.actions;

export const selectAssetTable = (state: AssetTableRootState) => state.assetTable;

export const selectIsNewAssetTableBannerDismissed = (state: AssetTableRootState) =>
    state.assetTable.isNewBannerDismissed;

export default assetTableSlice.reducer;
