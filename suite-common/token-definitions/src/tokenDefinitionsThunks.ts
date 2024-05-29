import { decode, verify } from 'jws';
import { D, G } from '@mobily/ts-belt';

import { getJWSPublicKey } from '@trezor/env-utils';
import { createThunk } from '@suite-common/redux-utils';
import { NetworkSymbol, getCoingeckoId } from '@suite-common/wallet-config';
import { isCodesignBuild } from '@trezor/env-utils';
import { Timeout } from '@trezor/type-utils';

import { selectNetworkTokenDefinitions } from './tokenDefinitionsSelectors';
import {
    TOKEN_DEFINITIONS_PREFIX_URL,
    TOKEN_DEFINITIONS_SUFFIX_URL,
    JWS_SIGN_ALGORITHM,
} from './tokenDefinitionsConstants';
import { DefinitionType } from './tokenDefinitionsTypes';
import { getSupportedDefinitionTypes } from './tokenDefinitionsUtils';

const TOKEN_DEFINITIONS_MODULE = '@common/wallet-core/token-definitions';

export const getTokenDefinitionThunk = createThunk(
    `${TOKEN_DEFINITIONS_MODULE}/getNftTokenDefinition`,
    async (
        params: {
            networkSymbol: NetworkSymbol;
            type: DefinitionType;
        },
        { fulfillWithValue, rejectWithValue },
    ) => {
        const { networkSymbol, type } = params;
        const coingeckoId = getCoingeckoId(networkSymbol);

        try {
            if (!coingeckoId) {
                throw Error(
                    'Cannot fetch token definitions for network without CoinGecko asset id!',
                );
            }

            const env = isCodesignBuild() ? 'stable' : 'develop';

            const response = await fetch(
                `${TOKEN_DEFINITIONS_PREFIX_URL}/${env}/${coingeckoId}.simple.${type}.${TOKEN_DEFINITIONS_SUFFIX_URL}`,
            );

            if (!response.ok) {
                throw Error(response.statusText);
            }

            const jws = await response.text();

            const decodedJws = decode(jws);

            const algorithmInHeader = decodedJws?.header.alg;
            if (algorithmInHeader !== JWS_SIGN_ALGORITHM) {
                throw Error(`Wrong algorithm in JWS config header: ${algorithmInHeader}`);
            }

            const authenticityPublicKey = getJWSPublicKey();

            if (G.isNullable(authenticityPublicKey)) {
                throw Error('Public key check token definitions authenticity was not found.');
            }

            const isAuthenticityValid = verify(jws, JWS_SIGN_ALGORITHM, authenticityPublicKey);

            if (!isAuthenticityValid) {
                throw Error('Config authenticity is invalid');
            }

            const data = JSON.parse(decodedJws.payload);

            return fulfillWithValue(data);
        } catch (error) {
            return rejectWithValue(error.toString());
        }
    },
);

export const initTokenDefinitionsThunk = createThunk(
    `${TOKEN_DEFINITIONS_MODULE}/initTokenDefinitionsThunk`,
    (_, { getState, dispatch, extra }) => {
        const enabledNetworks = extra.selectors.selectEnabledNetworks(getState());

        const promises = enabledNetworks
            .map((networkSymbol: NetworkSymbol) => {
                let definitionTypes = getSupportedDefinitionTypes(networkSymbol);

                const tokenDefinitions = selectNetworkTokenDefinitions(getState(), networkSymbol);

                if (tokenDefinitions) {
                    // Filter out definition types that have data or are in a loading state
                    definitionTypes = definitionTypes.filter(type => {
                        const definition = tokenDefinitions[type];

                        return !(definition && (definition.data || definition.isLoading));
                    });
                }

                if (D.isEmpty(definitionTypes)) return [];

                return definitionTypes.map(type =>
                    dispatch(
                        getTokenDefinitionThunk({
                            networkSymbol,
                            type,
                        }),
                    ),
                );
            })
            .flat();

        return Promise.all(promises);
    },
);

let tokenDefinitionsTimeout: Timeout | null = null;

export const periodicCheckTokenDefinitionsThunk = createThunk(
    `${TOKEN_DEFINITIONS_MODULE}/periodicCheckTokenDefinitionsThunk`,
    (_, { dispatch }) => {
        if (tokenDefinitionsTimeout) {
            clearTimeout(tokenDefinitionsTimeout);
        }

        tokenDefinitionsTimeout = setTimeout(() => {
            dispatch(periodicCheckTokenDefinitionsThunk());
        }, 60_000);

        return dispatch(initTokenDefinitionsThunk());
    },
);
