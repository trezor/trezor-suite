import produce from 'immer';
import { State as SendFormState } from '@wallet-types/sendForm';
import { SEND_CACHE } from '@wallet-actions/constants';
import { WalletAction } from '@wallet-types';

interface CacheItem {
    id: string;
    sendFormState: SendFormState;
}

interface State {
    cache: CacheItem[];
}

export const initialState: State = {
    cache: [],
};

export default (state: State = initialState, action: WalletAction): State => {
    return produce(state, draft => {
        switch (action.type) {
            case SEND_CACHE.ADD: {
                const { sendFormState, id } = action;
                const cacheItem = draft.cache.find(cacheItem => cacheItem.id === id);

                if (cacheItem) {
                    cacheItem.sendFormState = sendFormState;
                } else {
                    draft.cache.push({ id, sendFormState });
                }
                break;
            }

            case SEND_CACHE.REMOVE: {
                const { id } = action;
                draft.cache.filter(item => item.id === id);
                break;
            }

            case SEND_CACHE.CLEAR: {
                draft.cache = [];
                break;
            }
            // no default
        }
    });
};
