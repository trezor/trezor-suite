import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { getTokenDefinitionThunk } from './tokenDefinitionsThunks';
import { TokenDefinitionsState, TokenManagementAction } from './tokenDefinitionsTypes';
import { tokenDefinitionsActions } from './tokenDefinitionsActions';

const initialStatePredefined: Partial<TokenDefinitionsState> = {};

export const prepareTokenDefinitionsReducer = createReducerWithExtraDeps(
    initialStatePredefined,
    (builder, extra) => {
        builder
            .addCase(getTokenDefinitionThunk.pending, (state, action) => {
                const { networkSymbol } = action.meta.arg;

                if (!state[networkSymbol]) {
                    state[networkSymbol] = {
                        coin: {
                            error: false,
                            data: undefined,
                            isLoading: true,
                            hide: [],
                            show: [],
                        },
                        nft: {
                            error: false,
                            data: undefined,
                            isLoading: true,
                            hide: [],
                            show: [],
                        },
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
                        hide: definitions[type]?.hide ?? [],
                        show: definitions[type]?.show ?? [],
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
                        hide: definitions[type]?.hide ?? [],
                        show: definitions[type]?.show ?? [],
                    };
                }
            })
            .addCase(tokenDefinitionsActions.setTokenStatus, (state, action) => {
                const { networkSymbol, type, contractAddress, status } = action.payload;

                if (!state[networkSymbol]) {
                    state[networkSymbol] = {
                        coin: {
                            error: false,
                            data: undefined,
                            isLoading: true,
                            hide: [],
                            show: [],
                        },
                        nft: {
                            error: false,
                            data: undefined,
                            isLoading: true,
                            hide: [],
                            show: [],
                        },
                    };
                }

                const definitions = state[networkSymbol];

                if (definitions) {
                    let hide = definitions[type]?.hide ?? [];
                    let show = definitions[type]?.show ?? [];

                    if (status === TokenManagementAction.HIDE) {
                        if (!hide.includes(contractAddress) && !show.includes(contractAddress)) {
                            hide = [...hide, contractAddress];
                        }
                        show = show.filter(address => address !== contractAddress);
                    } else if (status === TokenManagementAction.SHOW) {
                        if (!show.includes(contractAddress) && !hide.includes(contractAddress)) {
                            show = [...show, contractAddress];
                        }
                        hide = hide.filter(address => address !== contractAddress);
                    }

                    definitions[type] = {
                        error: false,
                        data: definitions[type]?.data,
                        isLoading: false,
                        hide,
                        show,
                    };
                }
            })
            .addMatcher(
                action => action.type === extra.actionTypes.storageLoad,
                extra.reducers.storageLoadTokenManagement,
            );
    },
);
