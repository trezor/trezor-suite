import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { getTokenDefinitionThunk } from './tokenDefinitionsThunks';
import { TokenDefinitionsState } from './tokenDefinitionsTypes';

const initialStatePredefined: Partial<TokenDefinitionsState> = {};

export const prepareTokenDefinitionsReducer = createReducerWithExtraDeps(
    initialStatePredefined,
    builder => {
        builder
            .addCase(getTokenDefinitionThunk.pending, (state, action) => {
                const { networkSymbol, contractAddress } = action.meta.arg;

                if (!state[networkSymbol]) {
                    state[networkSymbol] = {};
                }

                const networkDefinitions = state[networkSymbol];

                if (networkDefinitions) {
                    networkDefinitions[contractAddress] = {
                        isTokenKnown: undefined,
                        error: false,
                    };
                }
            })
            .addCase(getTokenDefinitionThunk.fulfilled, (state, action) => {
                const { networkSymbol, contractAddress } = action.meta.arg;

                const networkDefinitions = state[networkSymbol];

                if (networkDefinitions) {
                    networkDefinitions[contractAddress] = {
                        isTokenKnown: action.payload,
                        error: false,
                    };
                }
            })
            .addCase(getTokenDefinitionThunk.rejected, (state, action) => {
                const { networkSymbol, contractAddress } = action.meta.arg;

                const networkDefinitions = state[networkSymbol];

                if (networkDefinitions) {
                    networkDefinitions[contractAddress] = {
                        isTokenKnown: undefined,
                        error: true,
                    };
                }
            });
    },
);
