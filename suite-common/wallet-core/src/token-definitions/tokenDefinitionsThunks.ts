import { createThunk } from '@suite-common/redux-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { selectSpecificTokenDefinition } from './tokenDefinitionsSelectors';

const actionsPrefix = '@common/wallet-core/token-definitions';

export const getTokenDefinitionThunk = createThunk(
    `${actionsPrefix}/getTokenDefinition`,
    async (
        params: { networkSymbol: NetworkSymbol; chainId: number; contractAddress: string },
        { getState, fulfillWithValue, rejectWithValue },
    ) => {
        const { networkSymbol, chainId, contractAddress } = params;
        const { isTokenKnown } =
            selectSpecificTokenDefinition(getState(), networkSymbol, contractAddress) || {};

        if (isTokenKnown === undefined) {
            try {
                const fetchedTokenDefinition = await fetch(
                    `https://data.trezor.io/firmware/eth-definitions/chain-id/${chainId}/token-${contractAddress
                        .substring(2)
                        .toLowerCase()}.dat`,
                    { method: 'HEAD' },
                );

                return fulfillWithValue(fetchedTokenDefinition.ok);
            } catch (error) {
                return rejectWithValue(error.toString());
            }
        }
    },
);
