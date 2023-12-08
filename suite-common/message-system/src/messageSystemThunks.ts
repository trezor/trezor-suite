import { decode, verify } from 'jws';

import { isCodesignBuild } from '@trezor/env-utils';
import { scheduleAction } from '@trezor/utils';
import { createThunk } from '@suite-common/redux-utils';
import { MessageSystem } from '@suite-common/suite-types';

import {
    VERSION,
    JWS_SIGN_ALGORITHM,
    CONFIG_URL_REMOTE,
    FETCH_CHECK_INTERVAL,
    FETCH_INTERVAL,
    FETCH_TIMEOUT,
} from './messageSystemConstants';
import { ACTION_PREFIX, messageSystemActions } from './messageSystemActions';
import {
    selectMessageSystemTimestamp,
    selectMessageSystemCurrentSequence,
} from './messageSystemSelectors';

const getConfigJws = async () => {
    const remoteConfigUrl = isCodesignBuild()
        ? CONFIG_URL_REMOTE.stable
        : CONFIG_URL_REMOTE.develop;

    try {
        const response = await scheduleAction(signal => fetch(remoteConfigUrl, { signal }), {
            timeout: FETCH_TIMEOUT,
        });

        if (!response.ok) {
            throw Error(response.statusText);
        }

        const configJws = await response.text();

        return {
            configJws,
            isRemote: true,
        };
    } catch (error) {
        console.error(`Fetching of remote JWS config failed: ${error}`);

        const { jws } = await import('../files/config.v1');

        return {
            configJws: jws,
            isRemote: false,
        };
    }
};

export const fetchConfigThunk = createThunk(
    `${ACTION_PREFIX}/fetchConfig`,
    async (jwsPublicKey: string, { dispatch, getState }) => {
        const timestamp = selectMessageSystemTimestamp(getState());
        const currentSequence = selectMessageSystemCurrentSequence(getState());

        if (Date.now() >= timestamp + FETCH_INTERVAL) {
            try {
                const { configJws, isRemote } = await getConfigJws();

                const decodedJws = decode(configJws);

                if (!decodedJws) {
                    throw Error('Decoding of config failed');
                }

                const algorithmInHeader = decodedJws?.header.alg;
                if (algorithmInHeader !== JWS_SIGN_ALGORITHM) {
                    throw Error(`Wrong algorithm in JWS config header: ${algorithmInHeader}`);
                }

                const isAuthenticityValid = verify(configJws, JWS_SIGN_ALGORITHM, jwsPublicKey);

                if (!isAuthenticityValid) {
                    throw Error('Config authenticity is invalid');
                }

                const config: MessageSystem = JSON.parse(decodedJws.payload);

                if (VERSION !== config.version) {
                    throw Error('Config version is not supported');
                }

                const timestampNew = isRemote ? Date.now() : 0;

                if (currentSequence < config.sequence) {
                    await dispatch(
                        messageSystemActions.fetchSuccessUpdate({
                            config,
                            timestamp: timestampNew,
                        }),
                    );
                } else if (currentSequence === config.sequence) {
                    await dispatch(messageSystemActions.fetchSuccess({ timestamp: timestampNew }));
                } else {
                    throw Error(
                        `Sequence of config (${config.sequence}) is older than the current one (${currentSequence}).`,
                    );
                }
            } catch (error) {
                console.error(error);
                await dispatch(messageSystemActions.fetchError());
            }
        }
    },
);

export const initMessageSystemThunk = createThunk(
    `${ACTION_PREFIX}/init`,
    async ({ jwsPublicKey }: { jwsPublicKey?: string }, { dispatch }) => {
        if (!jwsPublicKey) {
            throw Error('JWS public key is not defined!');
        }

        const checkConfig = async () => {
            await dispatch(fetchConfigThunk(jwsPublicKey));

            setTimeout(() => {
                checkConfig();
            }, FETCH_CHECK_INTERVAL);
        };

        await checkConfig();
    },
);
