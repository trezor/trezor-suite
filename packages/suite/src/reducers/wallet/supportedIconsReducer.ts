import produce from 'immer';
import { SUPPORTED_ICONS } from '@wallet-actions/constants';
import { WalletAction } from '@wallet-types';

interface State {
    tokenList: string[] | null;
}

export const initialState: State = {
    tokenList: null,
};

export default (state: State = initialState, action: WalletAction): State => {
    return produce(state, draft => {
        switch (action.type) {
            case SUPPORTED_ICONS.INIT:
                draft.tokenList = action.tokenList;
                break;
            // no default
        }
    });
};
