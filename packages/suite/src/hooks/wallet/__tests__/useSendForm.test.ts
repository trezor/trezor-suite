/* eslint-disable global-require */
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fixtures from '../__fixtures__/useSendForm';
import sendFormReducer from '@wallet-reducers/sendFormReducer';

import { renderWithCallback, waitForLoader, findByTestId } from './SendIndex';

jest.mock('react-svg', () => {
    return { ReactSVG: () => 'SVG' };
});

// render only Translation['id']
jest.mock('@suite-components/Translation', () => {
    return { Translation: ({ id }: any) => id };
});

jest.mock('trezor-connect', () => {
    let fixture: any;
    let fixtureIndex = 0;
    return {
        __esModule: true, // this property makes it work
        default: {
            composeTransaction: jest.fn(async _params => {
                // console.warn('trezor-connect:', params);
                if (!fixture) return { success: false, payload: { error: 'error' } };
                const f = Array.isArray(fixture) ? fixture[fixtureIndex] : fixture;
                fixtureIndex++;
                if (!f) return { success: false, payload: { error: 'error' } };
                if (typeof f.delay === 'number') {
                    await new Promise(resolve => setTimeout(resolve, f.delay));
                }
                return f.response;
            }),
            blockchainEstimateFee: () =>
                fixture || {
                    success: false,
                    payload: { error: 'error' },
                },
        },
        setTestFixtures: (f: any) => {
            fixture = f;
            fixtureIndex = 0;
        },
        DEVICE: {},
        BLOCKCHAIN: {},
    };
});

type SendState = ReturnType<typeof sendFormReducer>;
interface Args {
    send?: Partial<SendState>;
}

export const getInitialState = ({ send }: Args = {}) => {
    return {
        ...fixtures.DEFAULT_STORE,
        wallet: {
            ...fixtures.DEFAULT_STORE.wallet,
            send: {
                ...sendFormReducer(undefined, { type: 'foo' } as any),
                ...send,
            },
        },
        devices: [],
    };
};

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>([thunk]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const prevState = store.getState();
        store.getState().wallet.send = sendFormReducer(prevState.wallet.send, action);
        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

describe('useSendForm hook', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    fixtures.addingOutputs.forEach(f => {
        it(f.description, async () => {
            // @ts-ignore drafts are partial
            const store = initStore(getInitialState(f.store));
            const { unmount, callback } = renderWithCallback(store);

            // wait for compose
            await waitForLoader();
            if (!callback.getContextValues) throw Error('callback.getContextValues missing');

            expect(findByTestId(/outputs\[.*\].address/).length).toBe(f.initial.outputs.length);
            expect(callback.getContextValues().getValues()).toMatchObject(f.initial);

            for (let i = 0; i < f.actions.length; i++) {
                const a = f.actions[i];
                const button = findByTestId(a.button);
                userEvent.click(button);
                // wait for compose
                // eslint-disable-next-line no-await-in-loop
                await waitForLoader();

                // except for await loop there needs to be some eslint plugin for  @testing-library/waitFor
                // eslint-disable-next-line no-await-in-loop,no-loop-func
                await waitFor(() =>
                    expect(findByTestId(/outputs\[.*\].address/).length).toBe(
                        a.result.outputs.length,
                    ),
                );
                expect(callback.getContextValues().getValues()).toMatchObject(a.result);
            }

            unmount();
        });
    });

    fixtures.setMax.forEach(f => {
        it(f.description, async () => {
            require('trezor-connect').setTestFixtures(f.connect);
            // @ts-ignore drafts are partial
            const store = initStore(getInitialState(f.store));
            const { unmount, callback } = renderWithCallback(store);

            // wait for compose
            await waitForLoader();
            if (!callback.getContextValues) throw Error('callback.getContextValues missing');
            // wait for render
            // await waitFor(() => {
            const { composedLevels, getValues } = callback.getContextValues();
            expect(require('trezor-connect').default.composeTransaction).toBeCalledTimes(
                f.results.connectCalledTimes,
            );

            if (f.results.composedLevels) {
                expect(composedLevels).toMatchObject(f.results.composedLevels);
                expect(getValues()).toMatchObject(f.results.values);
            } else {
                expect(composedLevels).toBe(undefined);
            }
            // });

            unmount();
        });
    });

    fixtures.composeDebouncedTransaction.forEach(f => {
        it(f.description, async () => {
            require('trezor-connect').setTestFixtures(f.connect);
            const store = initStore(getInitialState());
            const { unmount, callback } = renderWithCallback(store);

            await act(() =>
                // @ts-ignore: act => Promise
                userEvent.type(
                    findByTestId(f.typing.element),
                    f.typing.value,
                    f.typing.delay ? { delay: f.typing.delay } : undefined,
                ),
            );

            if (f.typing.value === 'X') userEvent.clear(findByTestId(f.typing.element));
            // wait for compose
            await waitForLoader();
            if (!callback.getContextValues) throw Error('callback.getContextValues missing');

            expect(require('trezor-connect').default.composeTransaction).toBeCalledTimes(
                f.results.connectCalledTimes,
            );

            const { composedLevels, errors } = callback.getContextValues();

            if (f.results.composedLevels) {
                expect(composedLevels).toMatchObject(f.results.composedLevels);
            } else {
                expect(composedLevels).toBe(undefined);
            }

            if (f.results.errors) {
                expect(errors).toMatchObject(f.results.errors);
            }

            unmount();
        });
    });
});
