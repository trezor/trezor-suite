import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

export type AssetTableState = {
    areSmallBalancesShown: boolean;
};

type StorageLoadAssetTableAction = PayloadAction<{
    assetTable?: AssetTableState;
}>;

export const assetTableInitialState: AssetTableState = {
    areSmallBalancesShown: true,
};

const assetTableSlice = createSlice({
    name: 'assetTable',
    initialState: assetTableInitialState,
    reducers: {
        showSmallBalances: (state, { payload }: PayloadAction<boolean>) => {
            state.areSmallBalancesShown = payload;
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

export const selectAreSmallBalancesShown = (state: AssetTableRootState) =>
    state.assetTable.areSmallBalancesShown;

export default assetTableSlice.reducer;
