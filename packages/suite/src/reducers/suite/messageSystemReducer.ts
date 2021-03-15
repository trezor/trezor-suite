import produce from 'immer';
import { getUnixTime } from 'date-fns';
import { WritableDraft } from 'immer/dist/internal';

import { Action } from '@suite-types';
import { MESSAGE_SYSTEM, STORAGE } from '@suite/actions/suite/constants';
import { MessageSystem } from '@suite/types/suite/messageSystem';

export type MessageState = {
    banner: boolean;
    context: boolean;
    modal: boolean;
};

export type State = {
    config: MessageSystem | null;
    currentSequence: number;
    timestamp: number;

    validMessages: {
        banner: string[];
        context: string[];
        modal: string[];
    };
    dismissedMessages: {
        [key: string]: MessageState;
    };
};

const initialState: State = {
    config: null,
    currentSequence: 0,
    timestamp: 0,

    validMessages: {
        banner: [],
        context: [],
        modal: [],
    },
    dismissedMessages: {},
};

const getMessageStateById = (draft: WritableDraft<State>, id: string): MessageState => {
    if (!draft.dismissedMessages[id]) {
        draft.dismissedMessages[id] = { banner: false, context: false, modal: false };
    }
    return draft.dismissedMessages[id];
};

const messageSystemReducer = (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        let messageState;

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
            case MESSAGE_SYSTEM.FETCH_ERROR:
                draft.timestamp = 0;
                break;
            case MESSAGE_SYSTEM.SAVE_VALID_MESSAGES:
                draft.validMessages[action.category] = action.payload;
                break;
            case MESSAGE_SYSTEM.DISMISS_MESSAGE:
                messageState = getMessageStateById(draft, action.id);

                messageState[action.category] = true;
                break;
            default:
                break;
        }
    });
};

export default messageSystemReducer;
