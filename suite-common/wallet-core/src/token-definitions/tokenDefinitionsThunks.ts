import { decode, verify } from 'jws';
import { D, G } from '@mobily/ts-belt';

import { createThunk } from '@suite-common/redux-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { getNetwork } from '@suite-common/wallet-utils';
import { isNative } from '@trezor/env-utils';
import {
    DefinitionType,
    JWS_SIGN_ALGORITHM,
    TOKEN_DEFINITIONS_PREFIX_URL,
    TOKEN_DEFINITIONS_SUFFIX_URL,
    getSupportedDefinitionTypes,
} from '@suite-common/token-definitions';
import { isCodesignBuild } from '@trezor/env-utils';

import { selectNetworkTokenDefinitions } from './tokenDefinitionsSelectors';

const actionsPrefix = '@common/wallet-core/token-definitions';

export const getTokenDefinitionThunk = createThunk(
    `${actionsPrefix}/getNftTokenDefinition`,
    async (
        params: {
            networkSymbol: NetworkSymbol;
            type: DefinitionType;
        },
        { fulfillWithValue, rejectWithValue },
    ) => {
        const { networkSymbol, type } = params;
        const { coingeckoId } = getNetwork(networkSymbol) || {};

        try {
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

            const authenticityPublicKey = isNative()
                ? process.env.EXPO_PUBLIC_JWS_PUBLIC_KEY
                : process.env.JWS_PUBLIC_KEY;

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
    `${actionsPrefix}/initTokenDefinitionsThunk`,
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

let tokenDefinitionsTimeout: ReturnType<typeof setTimeout> | null = null;

export const periodicCheckTokenDefinitionsThunk = createThunk(
    `${actionsPrefix}/periodicCheckTokenDefinitionsThunk`,
    (_, { dispatch }) => {
        if (tokenDefinitionsTimeout) {
            clearTimeout(tokenDefinitionsTimeout!);
        }

        tokenDefinitionsTimeout = setTimeout(() => {
            dispatch(periodicCheckTokenDefinitionsThunk());
        }, 60_000);

        return dispatch(initTokenDefinitionsThunk());
    },
);
