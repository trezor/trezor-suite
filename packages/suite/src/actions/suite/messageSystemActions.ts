import * as jws from 'jws';

import { MESSAGE_SYSTEM } from '@suite-actions/constants';
import { scheduleAction } from '@trezor/utils';

import type { Dispatch, GetState } from '@suite-types';
import type { Category, MessageSystem } from '@trezor/message-system';

export type MessageSystemAction =
    | { type: typeof MESSAGE_SYSTEM.FETCH_CONFIG_SUCCESS; payload: { timestamp: number } }
    | {
          type: typeof MESSAGE_SYSTEM.FETCH_CONFIG_SUCCESS_UPDATE;
          payload: { config: MessageSystem; timestamp: number };
      }
    | { type: typeof MESSAGE_SYSTEM.FETCH_CONFIG_ERROR }
    | {
          type: typeof MESSAGE_SYSTEM.SAVE_VALID_MESSAGES;
          payload: ValidMessagesPayload;
      }
    | {
          type: typeof MESSAGE_SYSTEM.DISMISS_MESSAGE;
          payload: {
              category: Category;
              id: string;
          };
      };

export type ValidMessagesPayload = { [key in Category]: string[] };

const fetchSuccess = (timestamp: number): MessageSystemAction => ({
    type: MESSAGE_SYSTEM.FETCH_CONFIG_SUCCESS,
    payload: {
        timestamp,
    },
});

const fetchSuccessUpdate = (config: MessageSystem, timestamp: number): MessageSystemAction => ({
    type: MESSAGE_SYSTEM.FETCH_CONFIG_SUCCESS_UPDATE,
    payload: { config, timestamp },
});

const fetchError = (): MessageSystemAction => ({
    type: MESSAGE_SYSTEM.FETCH_CONFIG_ERROR,
});

const fetchConfig = () => async (dispatch: Dispatch, getState: GetState) => {
    const { timestamp, currentSequence } = getState().messageSystem;

    if (Date.now() >= timestamp + MESSAGE_SYSTEM.FETCH_INTERVAL) {
        try {
            let jwsResponse;
            let isRemote = true;

            try {
                const response = await scheduleAction(
                    signal => fetch(MESSAGE_SYSTEM.CONFIG_URL_REMOTE, { signal }),
                    { timeout: 1 || MESSAGE_SYSTEM.FETCH_TIMEOUT },
                );

                if (!response.ok) {
                    throw Error(response.statusText);
                }

                jwsResponse = await response.text();
            } catch (error) {
                console.error(`Fetching of remote JWS config failed: ${error}`);

                const response = await fetch(MESSAGE_SYSTEM.CONFIG_URL_LOCAL);

                if (!response.ok) {
                    throw Error(`Fetching of local JWS config failed: ${response.statusText}`);
                }

                jwsResponse = await response.text();
                isRemote = false;
            }

            const decodedJws = jws.decode(jwsResponse);

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

            const isAuthenticityValid = jws.verify(jwsResponse, algorithm, PUBLIC_KEY!);

            if (!isAuthenticityValid) {
                throw Error('Config authenticity is invalid');
            }

            const config: MessageSystem = JSON.parse(decodedJws.payload);

            if (MESSAGE_SYSTEM.VERSION !== config.version) {
                throw Error('Config version is not supported');
            }

            const timestamp = isRemote ? Date.now() : 0;

            if (currentSequence < config.sequence) {
                await dispatch(fetchSuccessUpdate(config, timestamp));
            } else if (currentSequence === config.sequence) {
                await dispatch(fetchSuccess(timestamp));
            } else {
                throw Error(
                    `Sequence of config (${config.sequence}) is older than the current one (${currentSequence}).`,
                );
            }
        } catch (error) {
            console.error(error);
            await dispatch(fetchError());
        }
    }
};

export const init = () => async (dispatch: Dispatch, _getState: GetState) => {
    const checkConfig = async () => {
        await dispatch(fetchConfig());

        setTimeout(() => {
            checkConfig();
        }, MESSAGE_SYSTEM.FETCH_CHECK_INTERVAL);
    };

    await checkConfig();
};

export const saveValidMessages = (payload: ValidMessagesPayload) => ({
    type: MESSAGE_SYSTEM.SAVE_VALID_MESSAGES,
    payload,
});

export const dismissMessage = (id: string, category: Category): MessageSystemAction => ({
    type: MESSAGE_SYSTEM.DISMISS_MESSAGE,
    payload: {
        id,
        category,
    },
});
