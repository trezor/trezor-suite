import { createAction } from '@reduxjs/toolkit';

import { NetworkSymbol } from '@suite-common/wallet-config';

import { DefinitionType, TokenManagementAction } from './tokenDefinitionsTypes';

export const TOKEN_DEFINITIONS_PREFIX = '@common/token-definitions';

const setTokenStatus = createAction(
    `${TOKEN_DEFINITIONS_PREFIX}/setTokenStatus`,
    (payload: {
        networkSymbol: NetworkSymbol;
        type: DefinitionType;
        status: TokenManagementAction;
        contractAddress: string;
    }) => ({
        payload,
    }),
);

export const tokenDefinitionsActions = {
    setTokenStatus,
};
