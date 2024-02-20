import { configureStore } from 'src/support/tests/configureStore';

import formDraftReducer, { FormDraftState } from 'src/reducers/wallet/formDraftReducer';
import * as formDraftActions from '../formDraftActions';

export const getInitialState = (state?: FormDraftState) => ({
    wallet: {
        formDrafts: formDraftReducer(state, { type: 'foo' } as any),
    },
});

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>();

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { formDrafts } = store.getState().wallet;
        store.getState().wallet.formDrafts = formDraftReducer(formDrafts, action);
        store.getActions().push(action);
    });

    return store;
};

describe('Form draft actions', () => {
    it('saves draft', () => {
        const initialState = getInitialState();
        const store = initStore(initialState);
        const expectedFormDraftState = {
            'coinmarket-buy/form': { input: 'value' },
        };

        store.dispatch(formDraftActions.saveDraft('coinmarket-buy')('form', { input: 'value' }));
        const formDraftState = store.getState().wallet.formDrafts;
        expect(formDraftState).toEqual(expectedFormDraftState);
    });

    it('gets draft', () => {
        const initialState = getInitialState({ 'coinmarket-buy/form': { input: 'value' } });
        const store = initStore(initialState);
        const expectedDraft = { input: 'value' };

        const draft = store.dispatch(formDraftActions.getDraft('coinmarket-buy')('form'));
        expect(draft).toEqual(expectedDraft);
    });

    it('removes draft', () => {
        const initialState = getInitialState({ 'coinmarket-buy/form': { input: 'value' } });
        const store = initStore(initialState);
        const expectedDraft = {};

        store.dispatch(formDraftActions.removeDraft('coinmarket-buy')('form'));
        expect(store.getState().wallet.formDrafts).toEqual(expectedDraft);
    });
});
