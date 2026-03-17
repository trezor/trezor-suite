import { createThunk } from '@suite-common/redux-utils';
import { type MessageSystem } from '@suite-common/suite-types';
import { PollingController, decodeJws, verifyJws } from '@suite-common/suite-utils';
import { isCodesignBuild, isNative } from '@trezor/env-utils';
import { scheduleAction } from '@trezor/utils';

import { ACTION_PREFIX, messageSystemActions } from './messageSystemActions';
import {
    CONFIG_URL_REMOTE,
    FETCH_CHECK_INTERVAL_IN_MS,
    FETCH_CHECK_INTERVAL_IN_MS_MOBILE,
    FETCH_INTERVAL_IN_MS,
    FETCH_INTERVAL_IN_MS_MOBILE,
    FETCH_TIMEOUT_IN_MS,
    JWS_SIGN_ALGORITHM,
    VERSION,
} from './messageSystemConstants';
import {
    selectMessageSystemConfigSource,
    selectMessageSystemCurrentSequence,
    selectMessageSystemTimestamp,
} from './messageSystemSelectors';
import { jws as configJwsLocal } from '../files/config.v1';

export const messageSystemPolling = new PollingController();

const getConfigJws = async (forceLocalJws: boolean) => {
    if (forceLocalJws) {
        return {
            configJws: configJwsLocal,
            isRemote: false,
        };
    }

    const remoteConfigUrl = isCodesignBuild()
        ? CONFIG_URL_REMOTE.stable
        : CONFIG_URL_REMOTE.develop;

    try {
        const response = await scheduleAction(signal => fetch(remoteConfigUrl, { signal }), {
            timeout: FETCH_TIMEOUT_IN_MS,
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
        console.warn(`Fetching of remote JWS config failed: ${error}`);

        return {
            configJws: configJwsLocal,
            isRemote: false,
        };
    }
};

const shouldFetchConfig = (isLocal: boolean, lastTimestamp: number) => {
    if (isLocal) return true;

    const now = Date.now();
    const interval = isNative() ? FETCH_INTERVAL_IN_MS_MOBILE : FETCH_INTERVAL_IN_MS;

    return now >= lastTimestamp + interval;
};

export const fetchConfigThunk = createThunk(
    `${ACTION_PREFIX}/fetchConfig`,
    async (_, { dispatch, getState }) => {
        const timestamp = selectMessageSystemTimestamp(getState());
        const currentSequence = selectMessageSystemCurrentSequence(getState());
        const configSource = selectMessageSystemConfigSource(getState());
        const useLocalConfig = configSource === 'local';

        if (shouldFetchConfig(useLocalConfig, timestamp)) {
            try {
                const { configJws, isRemote } = await getConfigJws(useLocalConfig);

                const decodedJws = decodeJws(configJws);

                if (!decodedJws) {
                    throw Error('Decoding of config failed');
                }

                const algorithmInHeader = decodedJws?.header.alg;
                if (algorithmInHeader !== JWS_SIGN_ALGORITHM) {
                    throw Error(`Wrong algorithm in JWS config header: ${algorithmInHeader}`);
                }

                const isAuthenticityValid = await verifyJws(configJws, JWS_SIGN_ALGORITHM);

                if (!isAuthenticityValid) {
                    throw Error('Config authenticity is invalid');
                }

                const config: MessageSystem = JSON.parse(decodedJws.payload);

                if (VERSION !== config.version) {
                    throw Error('Config version is not supported');
                }

                const timestampNew = isRemote ? Date.now() : 0;

                if (currentSequence < config.sequence || useLocalConfig) {
                    dispatch(
                        messageSystemActions.fetchSuccessUpdate({
                            config,
                            timestamp: timestampNew,
                        }),
                    );
                } else if (currentSequence === config.sequence) {
                    dispatch(messageSystemActions.fetchSuccess({ timestamp: timestampNew }));
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
    async (_, { dispatch }) => {
        const run = async () => {
            await dispatch(fetchConfigThunk()).unwrap();
        };
        const interval = isNative()
            ? FETCH_CHECK_INTERVAL_IN_MS_MOBILE
            : FETCH_CHECK_INTERVAL_IN_MS;

        await messageSystemPolling.restart(run, interval);
    },
);
