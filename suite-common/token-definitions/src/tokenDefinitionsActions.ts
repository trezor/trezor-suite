import { createAction } from '@reduxjs/toolkit';

import { type NetworkSymbol } from '@suite-common/wallet-config';

import {
    type DefinitionType,
    type SimpleTokenStructure,
    type TokenManagementAction,
} from './tokenDefinitionsTypes';

export const TOKEN_DEFINITIONS_PREFIX = '@common/token-definitions';

const setTokenStatus = createAction(
    `${TOKEN_DEFINITIONS_PREFIX}/setTokenStatus`,
    (payload: {
        symbol: NetworkSymbol;
        type: DefinitionType;
        status: TokenManagementAction;
        contractAddress: string;
    }) => ({
        payload,
    }),
);

export type SetDefinitionsPayload = {
    symbol: NetworkSymbol;
    type: DefinitionType;
    data: SimpleTokenStructure;
};

/** Replaces definitions loaded before with a newer copy, see `refreshTokenDefinitionsThunk`. */
const setDefinitions = createAction(
    `${TOKEN_DEFINITIONS_PREFIX}/setDefinitions`,
    (payload: SetDefinitionsPayload) => ({ payload }),
);

export const tokenDefinitionsActions = {
    setTokenStatus,
    setDefinitions,
};
