import produce from 'immer';

const initialState = {
    draft: null,
};

export default (state = initialState, action: WalletAction) => {
    return produce(state, draft => {
        switch (action.type) {
            case 'STORE':
                draft = action.payload;
                break;
            // no default
        }
    });
};
