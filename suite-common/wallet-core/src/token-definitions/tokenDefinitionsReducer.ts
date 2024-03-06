import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { getTokenDefinitionThunk } from './tokenDefinitionsThunks';
import { TokenDefinitionsState } from './tokenDefinitionsTypes';

const initialStatePredefined: Partial<TokenDefinitionsState> = {};

export const prepareTokenDefinitionsReducer = createReducerWithExtraDeps(
    initialStatePredefined,
    builder => {
        builder
            .addCase(getTokenDefinitionThunk.pending, (state, action) => {
                const { networkSymbol } = action.meta.arg;

                if (!state[networkSymbol]) {
                    state[networkSymbol] = {
                        coin: { error: false, data: undefined, isLoading: true },
                        nft: { error: false, data: undefined, isLoading: true },
                    };
                }
            })
            .addCase(getTokenDefinitionThunk.fulfilled, (state, action) => {
                const { networkSymbol, type } = action.meta.arg;

                const definitions = state[networkSymbol];

                if (definitions) {
                    definitions[type] = {
                        error: false,
                        data: action.payload,
                        isLoading: false,
                    };
                }
            })
            .addCase(getTokenDefinitionThunk.rejected, (state, action) => {
                const { networkSymbol, type } = action.meta.arg;

                const definitions = state[networkSymbol];

                if (definitions) {
                    definitions[type] = {
                        error: true,
                        data: undefined,
                        isLoading: false,
                    };
                }
            });
    },
);
