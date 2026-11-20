import {
    type ActionTypesDep,
    type ReducersDep,
    createReducerWithExtraDeps,
} from '@trezor/redux-utils';

import { tokenDefinitionsActions } from './tokenDefinitionsActions';
import { getTokenDefinitionThunk } from './tokenDefinitionsThunks';
import { type TokenDefinitionsState, TokenManagementAction } from './tokenDefinitionsTypes';
import { normalizeTokenContract } from './tokenDefinitionsUtils';

export const tokenDefinitionsInitialState: Partial<TokenDefinitionsState> = {};

type TokenDefinitionsReducerDeps = ActionTypesDep<'storageLoad'> &
    ReducersDep<'storageLoadTokenManagement'>;

export const prepareTokenDefinitionsReducer = createReducerWithExtraDeps(
    tokenDefinitionsInitialState,
    (builder, extra: TokenDefinitionsReducerDeps) => {
        builder
            .addCase(getTokenDefinitionThunk.pending, (state, action) => {
                const { symbol } = action.meta.arg;

                if (!state[symbol]) {
                    state[symbol] = {
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
                const { symbol, type } = action.meta.arg;

                const definitions = state[symbol];

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
                const { symbol, type } = action.meta.arg;

                const definitions = state[symbol];

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
                const { symbol, type, contractAddress, status } = action.payload;

                if (!state[symbol]) {
                    state[symbol] = {
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

                const definitions = state[symbol];

                if (definitions) {
                    const contract = normalizeTokenContract(symbol, contractAddress);
                    const isOtherContract = (address: string) =>
                        normalizeTokenContract(symbol, address) !== contract;
                    const hide = (definitions[type]?.hide ?? []).filter(isOtherContract);
                    const show = (definitions[type]?.show ?? []).filter(isOtherContract);

                    const visibilityList = status === TokenManagementAction.HIDE ? hide : show;
                    visibilityList.push(contractAddress);

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
