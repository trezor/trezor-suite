import { getUnixTime } from 'date-fns';

import { MESSAGE_SYSTEM } from '@suite-actions/constants';
import { Dispatch, GetState } from '@suite-types';
import { Category, MessageSystem } from '@suite/types/suite/messageSystem';
import { decodeJws, verifyJws } from '@suite/utils/suite/messageSystem';
import {
    FETCH_CHECK_INTERVAL,
    FETCH_INTERVAL,
    MESSAGE_SYSTEM_CONFIG_URL,
} from './constants/messageSystemConstants';
import { jwsPublicKey } from '@suite/constants/suite/keys';

export type MessageSystemAction =
    | { type: typeof MESSAGE_SYSTEM.FETCH_SUCCESS }
    | { type: typeof MESSAGE_SYSTEM.FETCH_SUCCESS_UPDATE; payload: MessageSystem }
    | { type: typeof MESSAGE_SYSTEM.FETCH_ERROR }
    | {
          type: typeof MESSAGE_SYSTEM.SAVE_VALID_MESSAGES;
          category: Category;
          payload: string[];
      }
    | {
          type: typeof MESSAGE_SYSTEM.DISMISS_MESSAGE;
          category: Category;
          id: string;
      };

const fetchSuccess = (): MessageSystemAction => ({
    type: MESSAGE_SYSTEM.FETCH_SUCCESS,
});

const fetchSuccessUpdate = (payload: MessageSystem): MessageSystemAction => ({
    type: MESSAGE_SYSTEM.FETCH_SUCCESS_UPDATE,
    payload,
});

const fetchFailure = (): MessageSystemAction => ({
    type: MESSAGE_SYSTEM.FETCH_ERROR,
});

export const fetchConfig = () => async (dispatch: Dispatch, getState: GetState) => {
    const { timestamp, currentSequence } = getState().messageSystem;

    if (getUnixTime(new Date()) + FETCH_INTERVAL >= timestamp) {
        try {
            const response = await fetch(MESSAGE_SYSTEM_CONFIG_URL);
            const jws = await response.text();

            const decodedJws = decodeJws(jws);

            if (!decodedJws) {
                throw Error('Config decoding failed');
            }

            const { alg } = decodedJws?.header;
            const isAuthenticityValid = verifyJws(jws, alg, jwsPublicKey);

            if (!isAuthenticityValid) {
                throw Error('Config authenticity invalid');
            }

            const config: MessageSystem = JSON.parse(decodedJws.payload);

            if (currentSequence < config.sequence) {
                dispatch(fetchSuccessUpdate(config));
            } else if (currentSequence === config.sequence) {
                dispatch(fetchSuccess());
            } else {
                throw Error('Fetched config is older than the current one');
            }
        } catch (error) {
            dispatch(fetchFailure());

            console.error('MessageSystem:', error);
        }
    }
};

let fetchConfigInterval: ReturnType<typeof setInterval>;

export const init = () => (dispatch: Dispatch, _getState: GetState) => {
    dispatch(fetchConfig());

    if (fetchConfigInterval) {
        clearInterval(fetchConfigInterval);
    }

    fetchConfigInterval = setInterval(() => {
        dispatch(fetchConfig());
    }, FETCH_CHECK_INTERVAL);
};

export const saveValidMessages = (payload: string[], category: Category) => ({
    type: MESSAGE_SYSTEM.SAVE_VALID_MESSAGES,
    payload,
    category,
});

export const dismissMessage = (id: string, category: Category) => ({
    type: MESSAGE_SYSTEM.DISMISS_MESSAGE,
    id,
    category,
});
