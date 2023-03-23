import { decode, verify } from 'jws';

import { scheduleAction } from '@trezor/utils';
import { createThunk } from '@suite-common/redux-utils';
import { MessageSystem } from '@trezor/message-system';

import { ACTION_PREFIX, messageSystemActions } from './messageSystemActions';
import {
    CONFIG_URL_LOCAL,
    CONFIG_URL_REMOTE,
    FETCH_CHECK_INTERVAL,
    FETCH_INTERVAL,
    FETCH_TIMEOUT,
    VERSION,
} from './messageSystemConstants';
import {
    selectMessageSystemTimestamp,
    selectMessageSystemCurrentSequence,
} from './messageSystemSelectors';

export const fetchConfigThunk = createThunk(
    `${ACTION_PREFIX}/fetchConfig`,
    async (_, { dispatch, getState }) => {
        const timestamp = selectMessageSystemTimestamp(getState());
        const currentSequence = selectMessageSystemCurrentSequence(getState());

        if (Date.now() >= timestamp + FETCH_INTERVAL) {
            try {
                let jwsResponse;
                let isRemote = true;

                try {
                    const response = await scheduleAction(
                        signal => fetch(CONFIG_URL_REMOTE, { signal }),
                        { timeout: FETCH_TIMEOUT },
                    );

                    if (!response.ok) {
                        throw Error(response.statusText);
                    }

                    jwsResponse = await response.text();
                } catch (error) {
                    console.error(`Fetching of remote JWS config failed: ${error}`);

                    const response = await fetch(CONFIG_URL_LOCAL);

                    if (!response.ok) {
                        throw Error(`Fetching of local JWS config failed: ${response.statusText}`);
                    }

                    jwsResponse = await response.text();
                    isRemote = false;
                }

                const decodedJws = decode(jwsResponse);

                if (!decodedJws) {
                    throw Error('Decoding of config failed');
                }

                // Disable eslint rule as object destruction does not work here
                // eslint-disable-next-line prefer-destructuring
                const PUBLIC_KEY = process.env.PUBLIC_KEY;

                // It has to be consistent with algorithm used for signing https://github.com/trezor/trezor-suite/blob/32bf733f3086bec1273caf03dfae1a5bccdbca24/packages/suite-data/src/message-system/scripts/sign-config.ts#L30
                const algorithm = 'ES256';

                const algorithmInHeader = decodedJws?.header.alg;
                if (algorithmInHeader !== algorithm) {
                    throw Error(`Wrong algorithm in JWS config header: ${algorithmInHeader}`);
                }

                const isAuthenticityValid = verify(jwsResponse, algorithm, PUBLIC_KEY!);

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
    async (_, { dispatch }) => {
        const checkConfig = async () => {
            await dispatch(fetchConfigThunk());

            setTimeout(() => {
                checkConfig();
            }, FETCH_CHECK_INTERVAL);
        };

        await checkConfig();
    },
);
