import produce from 'immer';
import { WalletAction } from '@wallet-types';

interface State {
    drafts: [];
}

const initialState = {
    drafts: [],
};

export default (state = initialState, action: WalletAction): State => {
    return produce(state, draft => {
        switch (action.type) {
            case 'STORE_DRAFT':
                draft = action.draft;
                break;
            // no default
        }
    });
};
