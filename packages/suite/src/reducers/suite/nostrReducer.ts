import produce from 'immer';
import { NostrClient } from '@trezor/connect-nostr';

import {
    // STORAGE,
    NOSTR,
} from 'src/actions/suite/constants';
import { Action } from 'src/types/suite';

type NostrState = {
    enabled: boolean;
    status: 'connected' | 'disconnected';
    relayUrl?: string;
    npub: NostrClient['npubStr'];
    nsec: NostrClient['nsecStr'];
    // todo:
    event: any;
    type: 'hot-keys' | 'signer';
};

export const initialState: NostrState = {
    enabled: false,
    type: 'hot-keys',
    status: 'disconnected',
    nsec: undefined,
    npub: undefined,
    event: {},
};

type NostrRootState = {
    nostr: NostrState;
};

export const nostrReducer = (state = initialState, action: Action): NostrState =>
    produce(state, draft => {
        switch (action.type) {
            // case STORAGE.LOAD:
            //     return {
            //         ...state,
            //         ...action.payload.nostr,
            //     };
            case NOSTR.DISPOSE:
                draft.enabled = false;
                break;
            case NOSTR.NEW_EVENT:
                draft.event = action.payload.event;
                break;
            case NOSTR.SET_STATUS:
                draft.status = action.payload.status;

                draft.npub = action.payload.npub;
                draft.nsec = action.payload.nsec;
                draft.relayUrl = action.payload.relayUrl;
                draft.type = action.payload.type;
                break;

            // no default
        }
    });

export const selectNostr = (state: NostrRootState) => state.nostr;
