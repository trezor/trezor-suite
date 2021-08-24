import * as jws from 'jws';

import { MESSAGE_SYSTEM } from '@suite-actions/constants';

import type { Dispatch, GetState } from '@suite-types';
import type { Category, MessageSystem } from '@suite-types/messageSystem';

export type MessageSystemAction =
    | { type: typeof MESSAGE_SYSTEM.FETCH_CONFIG_SUCCESS }
    | {
          type: typeof MESSAGE_SYSTEM.FETCH_CONFIG_SUCCESS_UPDATE;
          payload: MessageSystem;
          isRemote: boolean;
      }
    | { type: typeof MESSAGE_SYSTEM.FETCH_CONFIG_ERROR }
    | {
          type: typeof MESSAGE_SYSTEM.SAVE_VALID_MESSAGES;
          payload: ValidMessagesPayload;
      }
    | {
          type: typeof MESSAGE_SYSTEM.DISMISS_MESSAGE;
          category: Category;
          id: string;
      };

export type ValidMessagesPayload = { banner: string[]; context: string[]; modal: string[] };

const fetchSuccess = (): MessageSystemAction => ({
    type: MESSAGE_SYSTEM.FETCH_CONFIG_SUCCESS,
});

const fetchSuccessUpdate = (payload: MessageSystem, isRemote: boolean): MessageSystemAction => ({
    type: MESSAGE_SYSTEM.FETCH_CONFIG_SUCCESS_UPDATE,
    payload,
    isRemote,
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
                const response = await fetch(MESSAGE_SYSTEM.CONFIG_URL_REMOTE);

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

            const { alg } = decodedJws?.header;
            // Disable eslint rule as object destruction does not work here
            // eslint-disable-next-line prefer-destructuring
            const PUBLIC_KEY = process.env.PUBLIC_KEY;

            const isAuthenticityValid = jws.verify(jwsResponse, alg, PUBLIC_KEY!);

            if (!isAuthenticityValid) {
                throw Error('Config authenticity is invalid');
            }

            const config: MessageSystem = JSON.parse(decodedJws.payload);

            if (MESSAGE_SYSTEM.VERSION !== config.version) {
                throw Error('Config version is not supported');
            }

            if (currentSequence < config.sequence) {
                await dispatch(fetchSuccessUpdate(config, isRemote));
            } else if (currentSequence === config.sequence) {
                await dispatch(fetchSuccess());
            } else {
                throw Error('Sequence of config is older than the current one');
            }
        } catch (error) {
            console.error(error);
            await dispatch(fetchError());
        }
    }
};

export const init = () => async (dispatch: Dispatch, _getState: GetState) => {
    await dispatch(fetchConfig());

    setInterval(async () => {
        await dispatch(fetchConfig());
    }, MESSAGE_SYSTEM.FETCH_CHECK_INTERVAL);
};

export const saveValidMessages = (payload: ValidMessagesPayload) => ({
    type: MESSAGE_SYSTEM.SAVE_VALID_MESSAGES,
    payload,
});

export const dismissMessage = (id: string, category: Category) => ({
    type: MESSAGE_SYSTEM.DISMISS_MESSAGE,
    id,
    category,
});
