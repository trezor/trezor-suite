import { getUnixTime } from 'date-fns';
import { MESSAGE_SYSTEM } from '@suite-actions/constants';
import { Dispatch, GetState } from '@suite-types';
import { Category, MessageSystem, Notification } from '@suite/types/suite/messageSystem';
import {
    decodeMessageSystemJwsConfig,
    verifyMessageSystemJwsConfig,
} from '@suite/utils/suite/messageSystem';
import {
    FETCH_CHECK_INTERVAL,
    FETCH_INTERVAL,
    MESSAGE_SYSTEM_JWS_CONFIG_URL,
} from './constants/messageSystemConstants';

export type MessageSystemAction =
    | { type: typeof MESSAGE_SYSTEM.FETCH_INIT }
    | { type: typeof MESSAGE_SYSTEM.FETCH_FAILURE }
    | { type: typeof MESSAGE_SYSTEM.FETCH_SUCCESS }
    | { type: typeof MESSAGE_SYSTEM.FETCH_SUCCESS_UPDATE; payload: MessageSystem }
    | {
          type: typeof MESSAGE_SYSTEM.SAVE_COMPATIBLE_NOTIFICATIONS;
          category: Category;
          payload: string[];
      }
    | {
          type: typeof MESSAGE_SYSTEM.NOTIFICATION_DISMISSED;
          category: Category;
          id: string;
      };

// TODO: Do I need to have this action?
const fetchInit = (): MessageSystemAction => ({
    type: MESSAGE_SYSTEM.FETCH_INIT,
});

const fetchSuccess = (): MessageSystemAction => ({
    type: MESSAGE_SYSTEM.FETCH_SUCCESS,
});

// TODO: Better naming?
const fetchSuccessWithUpdate = (payload: MessageSystem): MessageSystemAction => ({
    type: MESSAGE_SYSTEM.FETCH_SUCCESS_UPDATE,
    payload,
});

const fetchFailure = (): MessageSystemAction => ({
    type: MESSAGE_SYSTEM.FETCH_FAILURE,
});

export const fetchConfig = () => async (dispatch: Dispatch, getState: GetState) => {
    const { timestamp, currentSequence } = getState().messageSystem;

    if (getUnixTime(new Date()) + FETCH_INTERVAL >= timestamp) {
        dispatch(fetchInit());

        try {
            const response = await fetch(MESSAGE_SYSTEM_JWS_CONFIG_URL);
            const jwsConfig = await response.text();

            const jwsConfigDecoded = decodeMessageSystemJwsConfig(jwsConfig);

            if (!jwsConfigDecoded) {
                throw Error('MessageSystem config decoded unsuccessfully');
            }

            const { alg } = jwsConfigDecoded?.header;
            const isAuthenticityValid = verifyMessageSystemJwsConfig(jwsConfig, alg);

            if (!isAuthenticityValid) {
                throw Error('MessageSystem config authenticity invalid');
            }

            const payload: MessageSystem = JSON.parse(jwsConfigDecoded.payload);

            if (currentSequence < payload.sequence) {
                dispatch(fetchSuccessWithUpdate(payload));
            } else if (currentSequence === payload.sequence) {
                dispatch(fetchSuccess());
            } else {
                throw Error('MessageSystem config fetched is older than the current one');
            }
        } catch (error) {
            // TODO: Logger?
            dispatch(fetchFailure());
        }
    }
};

let fetchMessageSystemConfigInterval: ReturnType<typeof setInterval>;

export const init = () => (dispatch: Dispatch, _getState: GetState) => {
    dispatch(fetchConfig());

    if (fetchMessageSystemConfigInterval) {
        clearInterval(fetchMessageSystemConfigInterval);
    }

    fetchMessageSystemConfigInterval = setInterval(() => {
        dispatch(fetchConfig());
    }, FETCH_CHECK_INTERVAL);
};

export const saveCompatibleNotifications = (messages: string[], category: Category) => ({
    type: MESSAGE_SYSTEM.SAVE_COMPATIBLE_NOTIFICATIONS,
    payload: messages,
    category,
});

export const dismissNotification = (id: string, category: Category) => ({
    type: MESSAGE_SYSTEM.NOTIFICATION_DISMISSED,
    id,
    category,
});
