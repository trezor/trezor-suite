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
import { Timeout } from '@trezor/type-utils';
import { getJWSPublicKey } from '@suite-native/config/libDev/src';

import { selectNetworkTokenDefinitions } from './tokenDefinitionsSelectors';

const TOKEN_DEFINITIONS_MODULE = '@common/wallet-core/token-definitions';

export const getTokenDefinitionThunk = createThunk(
    `${TOKEN_DEFINITIONS_MODULE}/getNftTokenDefinition`,
    async (
        params: {
            networkSymbol: NetworkSymbol;
            type: DefinitionType;
            showAlert: any;
        },
        { fulfillWithValue, rejectWithValue },
    ) => {
        const { networkSymbol, type } = params;
        const { coingeckoId } = getNetwork(networkSymbol) || {};

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

            const authenticityPublicKey = isNative()
                ? getJWSPublicKey()
                : process.env.JWS_PUBLIC_KEY;

            if (G.isNullable(authenticityPublicKey)) {
                throw Error('Public key check token definitions authenticity was not found.');
            }

            const isAuthenticityValid = verify(jws, JWS_SIGN_ALGORITHM, authenticityPublicKey);

            if (!isAuthenticityValid) {
                throw Error('Config authenticity is invalid');
            }

            const data = JSON.parse(decodedJws.payload);

            // show alert s datama pro jws, codesign build,

            params.showAlert(
                `jws: ${jws}, env: ${env}, decodedJws: ${decodedJws}, authenticityPublicKey: ${authenticityPublicKey}, isAuthenticityValid: ${isAuthenticityValid}, url: ${TOKEN_DEFINITIONS_PREFIX_URL}/${env}/${coingeckoId}.simple.${type}.${TOKEN_DEFINITIONS_SUFFIX_URL}, data: ${data}`,
            );

            return fulfillWithValue(data);
        } catch (error) {
            return rejectWithValue(error.toString());
        }
    },
);

export const initTokenDefinitionsThunk = createThunk(
    `${TOKEN_DEFINITIONS_MODULE}/initTokenDefinitionsThunk`,
    ({ showAlert }: { showAlert: any }, { getState, dispatch, extra }) => {
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
                            showAlert,
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
    ({ showAlert }: { showAlert: any }, { dispatch }) => {
        if (tokenDefinitionsTimeout) {
            clearTimeout(tokenDefinitionsTimeout);
        }

        tokenDefinitionsTimeout = setTimeout(() => {
            dispatch(periodicCheckTokenDefinitionsThunk({ showAlert }));
        }, 60_000);

        return dispatch(initTokenDefinitionsThunk({ showAlert }));
    },
);
