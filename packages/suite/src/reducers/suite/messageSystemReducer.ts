import produce from 'immer';
import { getUnixTime } from 'date-fns';
import { Action } from '@suite-types';
import { MESSAGE_SYSTEM, STORAGE } from '@suite/actions/suite/constants';
import { MessageSystem } from '@suite/types/suite/messageSystem';
import { WritableDraft } from 'immer/dist/internal';

type NotificationState = {
    banner: boolean;
    context: boolean;
    modal: boolean;
};

export type State = {
    currentSequence: number;
    config: MessageSystem | null;

    compatibleNotifications: {
        banner: string[];
        context: string[];
        modal: string[];
    };

    dismissedNotifications: {
        [key: string]: NotificationState;
    };

    isFetching: boolean;
    hasError: boolean;
    timestamp: number;
};

const initialState: State = {
    currentSequence: 0,
    config: null,

    compatibleNotifications: {
        banner: [],
        context: [],
        modal: [],
    },

    dismissedNotifications: {},

    isFetching: false,
    hasError: false,
    timestamp: 0,
};

const getNotificationById = (draft: WritableDraft<State>, id: string): NotificationState => {
    if (!draft.dismissedNotifications[id]) {
        draft.dismissedNotifications[id] = { banner: false, context: false, modal: false };
    }
    return draft.dismissedNotifications[id];
};

const messageSystemReducer = (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        let notification;

        switch (action.type) {
            case STORAGE.LOADED:
                return action.payload.messageSystem;
            case MESSAGE_SYSTEM.FETCH_INIT:
                draft.isFetching = true;
                draft.hasError = false;
                break;
            case MESSAGE_SYSTEM.FETCH_SUCCESS_UPDATE:
                draft.config = action.payload;
                draft.currentSequence = action.payload.sequence; // TODO: check
            // eslint-disable-next-line no-fallthrough
            case MESSAGE_SYSTEM.FETCH_SUCCESS:
                draft.timestamp = getUnixTime(new Date());
                draft.isFetching = false;
                draft.hasError = false;
                break;
            case MESSAGE_SYSTEM.FETCH_FAILURE:
                draft.isFetching = false;
                draft.hasError = true;
                draft.timestamp = 0;
                break;
            case MESSAGE_SYSTEM.SAVE_COMPATIBLE_NOTIFICATIONS:
                draft.compatibleNotifications[action.category] = action.payload;
                break;
            case MESSAGE_SYSTEM.NOTIFICATION_DISMISSED:
                notification = getNotificationById(draft, action.id);
                notification[action.category] = true;
                break;
            default:
                break;
        }
    });
};

export default messageSystemReducer;
