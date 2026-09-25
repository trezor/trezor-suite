import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

/**
 * What the user chose to see in the asset table, kept between runs.
 *
 * Its own slice and its own object store, because the asset table is an experiment: when it goes,
 * so do the reducer, the store and the migration that made it, and nothing else is touched.
 */
export type AssetTableState = {
    areSmallBalancesShown: boolean;
};

type StorageLoadAssetTableAction = PayloadAction<{
    assetTable?: AssetTableState;
}>;

export const assetTableInitialState: AssetTableState = {
    areSmallBalancesShown: true,
};

export const assetTableSlice = createSlice({
    name: 'assetTable',
    initialState: assetTableInitialState,
    reducers: {
        showSmallBalances: (state, { payload }: PayloadAction<boolean>) => {
            state.areSmallBalancesShown = payload;
        },
    },
    extraReducers: builder => {
        // The storage action is not imported to keep this slice out of the app's dependency graph.
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
