import {
    compareConfigSequence,
    fetchRemoteConfigJws,
    getRemoteConfigUrl,
    verifyConfigJws,
} from '@suite-common/message-system-core';
import { createThunk } from '@suite-common/redux-utils';
import { PollingController } from '@suite-common/suite-utils';
import { isCodesignBuild, isNative } from '@trezor/env-utils';

import { ACTION_PREFIX, messageSystemActions } from './messageSystemActions';
import {
    FETCH_CHECK_INTERVAL_IN_MS,
    FETCH_CHECK_INTERVAL_IN_MS_MOBILE,
    FETCH_INTERVAL_IN_MS,
    FETCH_INTERVAL_IN_MS_MOBILE,
} from './messageSystemConstants';
import {
    selectMessageSystemConfigSource,
    selectMessageSystemCurrentSequence,
    selectMessageSystemTimestamp,
} from './messageSystemSelectors';
import { type MessageSystemRootState } from './messageSystemTypes';
import { jws as configJwsLocal } from '../files/config.v1';

const messageSystemPolling = new PollingController();

const getConfigJws = async (forceLocalJws: boolean) => {
    if (forceLocalJws) {
        return {
            configJws: configJwsLocal,
            isRemote: false,
        };
    }

    try {
        const configJws = await fetchRemoteConfigJws(getRemoteConfigUrl(isCodesignBuild()));

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

type FetchConfigThunkState = MessageSystemRootState;

export const fetchConfigThunk = createThunk<void, void, { state: FetchConfigThunkState }>(
    `${ACTION_PREFIX}/fetchConfig`,
    async (_, { dispatch, getState }) => {
        const timestamp = selectMessageSystemTimestamp(getState());
        const currentSequence = selectMessageSystemCurrentSequence(getState());
        const configSource = selectMessageSystemConfigSource(getState());
        const useLocalConfig = configSource === 'local';

        if (shouldFetchConfig(useLocalConfig, timestamp)) {
            try {
                const { configJws, isRemote } = await getConfigJws(useLocalConfig);

                const config = verifyConfigJws(configJws);

                const timestampNew = isRemote ? Date.now() : 0;
                const sequenceComparison = compareConfigSequence(currentSequence, config.sequence);

                if (sequenceComparison === 'newer' || useLocalConfig) {
                    dispatch(
                        messageSystemActions.fetchSuccessUpdate({
                            config,
                            timestamp: timestampNew,
                        }),
                    );
                } else if (sequenceComparison === 'same') {
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

type InitMessageSystemThunkState = FetchConfigThunkState;

export const initMessageSystemThunk = createThunk<
    void,
    void,
    { state: InitMessageSystemThunkState }
>(`${ACTION_PREFIX}/init`, async (_, { dispatch }) => {
    const run = async () => {
        await dispatch(fetchConfigThunk()).unwrap();
    };
    const interval = isNative() ? FETCH_CHECK_INTERVAL_IN_MS_MOBILE : FETCH_CHECK_INTERVAL_IN_MS;

    await messageSystemPolling.restart(run, interval);
});
