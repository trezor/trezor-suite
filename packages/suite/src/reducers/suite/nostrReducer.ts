import produce from 'immer';

import { STORAGE, NOSTR } from 'src/actions/suite/constants';
import { Action } from 'src/types/suite';

type NostrState = {
    enabled: boolean;
    status: 'connected' | 'disconnected' | 'connecting';
    relayUrl?: string;
    keys: {
        nsec: string;
        npub: string;
    };
    event: any;
    type: 'hot-keys' | 'signer';
};

export const initialState: NostrState = {
    enabled: false,
    type: 'hot-keys',
    status: 'disconnected',
    keys: {
        nsec: '',
        npub: '',
    },
    event: {},
};

type NostrRootState = {
    nostr: NostrState;
};

export const nostrReducer = (state = initialState, action: Action): NostrState =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD:
                return {
                    ...state,
                    ...action.payload.nostr,
                };
            case NOSTR.INIT:
                draft.enabled = true;
                draft.keys.npub = action.payload.npub;
                draft.keys.nsec = action.payload.nsec;
                draft.relayUrl = action.payload.relayUrl;
                draft.type = action.payload.type;

                draft = { ...draft };

                break;
            case NOSTR.DISPOSE:
                draft.enabled = false;
                break;
            case NOSTR.NEW_EVENT:
                draft.event = action.payload.event;
                break;
            case NOSTR.SET_STATUS:
                draft.status = action.payload.status;
                break;

            // no default
        }
    });

export const selectNostr = (state: NostrRootState) => state.nostr;
