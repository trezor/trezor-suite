import produce from 'immer';
import { getUnixTime } from 'date-fns';
import { WritableDraft } from 'immer/dist/internal';

import { Action } from '@suite-types';
import { MESSAGE_SYSTEM, STORAGE } from '@suite/actions/suite/constants';
import { MessageSystem } from '@suite/types/suite/messageSystem';

export type NotificationState = {
    banner: boolean;
    context: boolean;
    modal: boolean;
};

export type State = {
    config: MessageSystem | null;
    currentSequence: number;
    timestamp: number;

    compatibleNotifications: {
        banner: string[];
        context: string[];
        modal: string[];
    };
    dismissedNotifications: {
        [key: string]: NotificationState;
    };
};

const initialState: State = {
    config: null,
    currentSequence: 0,
    timestamp: 0,

    compatibleNotifications: {
        banner: [],
        context: [],
        modal: [],
    },
    dismissedNotifications: {},
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
            case MESSAGE_SYSTEM.FETCH_SUCCESS:
                draft.timestamp = getUnixTime(new Date());
                break;
            case MESSAGE_SYSTEM.FETCH_SUCCESS_UPDATE:
                draft.timestamp = getUnixTime(new Date());
                draft.config = action.payload;
                draft.currentSequence = action.payload.sequence;
                break;
            case MESSAGE_SYSTEM.FETCH_FAILURE:
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
