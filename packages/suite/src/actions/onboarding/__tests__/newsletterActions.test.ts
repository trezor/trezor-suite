import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import newsletterReducer from '@onboarding-reducers/newsletterReducer';
import * as newsletterActions from '@onboarding-actions/newsletterActions';
import { fixtures } from '../__fixtures__/newsletterActions';

type NewsletterState = ReturnType<typeof newsletterReducer>;

export const getInitialState = (newsletter?: Partial<NewsletterState>) => {
    return {
        onboarding: {
            newsletter: {
                ...newsletterReducer(undefined, { type: 'foo' } as any),
                ...newsletter,
            },
        },
    };
};

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>([thunk]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { onboarding } = store.getState();
        store.getState().onboarding.newsletter = newsletterReducer(onboarding.newsletter, action);
        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

const setFetchMock = (mock: any) => {
    // @ts-ignore
    global.fetch = jest.fn().mockImplementation(() => {
        const p = new Promise(resolve => {
            resolve({
                ok: mock.ok,
                statusText: mock.statusText || '',
                json: () =>
                    new Promise((resolve, reject) => {
                        if (mock.reject) {
                            return reject(mock.reject);
                        }
                        return resolve(mock.response);
                    }),
            });
        });

        return p;
    });
};

describe('Newsletter Actions', () => {
    fixtures.forEach(f => {
        it(f.description, async () => {
            const state = getInitialState();
            const store = initStore(state);
            f.actions.forEach((action: any, i: number) => {
                store.dispatch(action());
                expect(store.getState().onboarding.newsletter).toMatchObject(f.result[i]);
            });
        });
    });

    it('submitEmail action - set isProgress true and then resolve', async () => {
        setFetchMock({ ok: true });
        const state = getInitialState({ email: 'foo@foo.foo' });
        const store = initStore(state);
        const promise = store.dispatch(newsletterActions.submitEmail());
        expect(store.getState().onboarding.newsletter).toMatchObject({
            isProgress: true,
            isSuccess: false,
        });
        await promise;
        expect(store.getState().onboarding.newsletter).toMatchObject({
            isProgress: false,
            isSuccess: true,
        });
    });

    it('submitEmail action - error', async () => {
        setFetchMock({ ok: false, statusText: 'foo' });
        const state = getInitialState({ email: 'foo@foo.foo' });
        const store = initStore(state);
        const promise = store.dispatch(newsletterActions.submitEmail());
        expect(store.getState().onboarding.newsletter).toMatchObject({
            isProgress: true,
            isSuccess: false,
            error: null,
        });
        await promise;
        expect(store.getState().onboarding.newsletter).toMatchObject({
            isProgress: false,
            isSuccess: false,
            error: 'foo',
        });
    });
});
