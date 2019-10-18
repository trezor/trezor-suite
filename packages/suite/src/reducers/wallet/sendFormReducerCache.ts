import produce from 'immer';
import { State as SendFormState } from '@wallet-types/sendForm';
import { SEND_CACHE } from '@wallet-actions/constants';
import { WalletAction } from '@wallet-types';
import { db } from '@suite/storage';

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

                const item = db.getItemByPK('sendForm', id);

                if (item) {
                    db.addItem('sendForm', { id, state: sendFormState });
                } else {
                    db.addItem('sendForm', { id, state: sendFormState });
                }
                break;
            }
            // no default
        }
    });
};
