import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const actionPrefix = '@accountsImport';

export type AccountsImportState = Record<string, string>;

const initialState: AccountsImportState = {};

export type AccountsImportRootState = {
    wallet: {
        accountsImport: AccountsImportState;
    };
};

const accountsImportSlice = createSlice({
    name: actionPrefix,
    initialState,
    reducers: {
        setAccountName: (
            state,
            action: PayloadAction<{
                descriptor: string;
                name: string;
            }>,
        ) => {
            const { descriptor, name } = action.payload;
            state[descriptor] = name;
        },
    },
});

export const { setAccountName } = accountsImportSlice.actions;
export const accountsImportReducer = accountsImportSlice.reducer;
