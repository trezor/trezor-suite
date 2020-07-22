/* eslint-disable global-require */
import React from 'react';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { act, renderHook } from '@testing-library/react-hooks';
import { render, fireEvent, screen, waitFor, waitForDomChange } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SendFormIndex from '@wallet-views/send/Container';
import { SendContext, useSendForm } from '../useSendForm';
import * as fixtures from '../__fixtures__/useSendForm';
import sendFormReducer from '@wallet-reducers/sendFormReducer';
import { createDeferred, Deferred } from '@suite-utils/deferred';

jest.mock('react-svg', () => {
    return {
        ReactSVG: props => {
            console.log('ReactSVG', props, props.src);
            return 'SVG';
        },
    };
});

jest.mock('@suite-components/Translation', () => {
    return {
        Translation: ({ id }: any) => {
            return id;
        },
    };
});

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

jest.mock('trezor-connect', () => {
    let fixture: any;
    return {
        __esModule: true, // this property makes it work
        default: {
            composeTransaction2: () => {
                console.warn('composeTransaction in connect');
                return { success: false };
            },
            composeTransaction: jest.fn(async () => {
                if (!fixture) return { success: false };
                console.warn('---->WAIT FOR CONNECT!', fixture);
                if (typeof fixture.delay === 'number') {
                    await new Promise(resolve => setTimeout(resolve, fixture.delay));
                }
                return fixture.response;
            }),
            blockchainEstimateFee: () =>
                fixture || {
                    success: false,
                },
        },
        setTestFixtures: (f: any) => {
            fixture = f;
        },
        DEVICE: {},
        BLOCKCHAIN: {},
    };
});

export const getInitialState = (state?: any) => {
    return {
        suite: { device: {}, settings: { debug: {} } },
        wallet: {
            selectedAccount: {
                status: 'loaded',
                account: {
                    symbol: 'btc',
                    networkType: 'bitcoin',
                    descriptor: 'xpub',
                    deviceState: 'deviceState',
                    addresses: { change: [], used: [], unused: [] },
                    utxo: [],
                },
                network: { networkType: 'bitcoin', decimals: 8 },
            },
            settings: {
                localCurrency: 'usd',
                debug: {},
            },
            fees: { btc: { levels: [] } },
            fiat: {
                coins: [
                    {
                        symbol: 'btc',
                    },
                ],
            },
            send: {
                precomposedTx: undefined,
                lastUsedFeeLevel: undefined,
                drafts: state && state.drafts ? state.drafts : {},
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
        // store.getState().suite = suiteReducer(suite, action);
        // store.getState().devices = deviceReducer(devices, action);
        store.getState().wallet.send = sendFormReducer(prevState.wallet.send, action);
        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

type Callback = {
    getContextValues: () => any;
};

const findByName = (list: HTMLElement[], filter: RegExp) => {
    return list.filter(el => {
        const name = el.getAttribute('name');
        if (!name) return false;
        return filter.test(name);
    });
};

const Index = ({ callback }: any) => {
    const sendFormContext = useSendForm({
        localCurrencyOption: { value: 'usd', label: 'USD' },
        feeInfo: { levels: [{ label: 'normal', feePerUnit: '1', blocks: 1 }] },
    });
    callback.getContextValues = () => {
        return sendFormContext;
    };

    const {
        outputs,
        register,
        addOutput,
        removeOutput,
        resetContext,
        composeTransaction,
    } = sendFormContext;

    return (
        <div>
            <button type="button" onClick={addOutput}>
                Add
            </button>
            <button type="button" onClick={resetContext}>
                Reset
            </button>
            {outputs.map((output, index) => {
                return (
                    <div key={output.id}>
                        <button type="button" onClick={() => removeOutput(index)}>
                            Remove
                        </button>
                        <input
                            name={`outputs[${index}].address`}
                            ref={register({ required: 'TR_' })}
                            defaultValue={output.address}
                            onChange={() => {
                                composeTransaction(`outputs[${index}].amount`);
                            }}
                        />
                        <input
                            name={`outputs[${index}].amount`}
                            ref={register({ required: 'TR_' })}
                            defaultValue={output.amount}
                            onChange={event => {
                                console.warn('AMOUNT ON CHANGE!', event.target.value);
                                composeTransaction(`outputs[${index}].amount`);
                            }}
                        />
                        <input
                            name={`outputs[${index}].fiat`}
                            ref={register({ required: 'TR_' })}
                            defaultValue={output.fiat}
                        />
                    </div>
                );
            })}
        </div>
    );
};

const SendFormWithProviders = ({ store, callback }: any) => (
    <Provider store={store}>
        <IntlProvider locale="en">
            <Index callback={callback} />
        </IntlProvider>
    </Provider>
);

describe('useSendForm hook', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    fixtures.addingOutputs.forEach(f => {
        it(f.description, async () => {
            const state = getInitialState(f.state);
            const store = initStore(state);
            const callback: Callback = {
                getContextValues: () => null,
            };
            const { unmount } = render(<SendFormWithProviders store={store} callback={callback} />);

            // wait for first render (possible async compose after loading draft)
            await waitFor(() => {});

            const initialInputs = findByName(
                screen.getAllByRole('textbox'),
                /outputs\[.*\].address/,
            );
            expect(initialInputs.length).toBe(f.results[0].outputs.length);
            expect(callback.getContextValues().getValues()).toMatchObject(f.results[0]);

            const buttonAdd = screen.getByRole('button', { name: /Add/i });
            // add new output
            fireEvent.click(buttonAdd);
            // should have two
            const twoInputs = findByName(screen.getAllByRole('textbox'), /outputs\[.*\].address/);
            expect(twoInputs.length).toBe(f.results[1].outputs.length);
            expect(callback.getContextValues().getValues()).toMatchObject(f.results[1]);

            // remove first output
            const buttonsRemove = screen.getAllByRole('button', { name: 'Remove' });
            fireEvent.click(buttonsRemove[0]);
            // should have one
            const oneInput = findByName(screen.getAllByRole('textbox'), /outputs\[.*\].address/);
            expect(oneInput.length).toBe(f.results[2].outputs.length);
            expect(callback.getContextValues().getValues()).toMatchObject(f.results[2]);

            // reset form
            const buttonReset = screen.getByRole('button', { name: 'Reset' });
            fireEvent.click(buttonReset);

            // after reset
            const endInputs = findByName(screen.getAllByRole('textbox'), /outputs\[.*\].address/);
            expect(endInputs.length).toBe(f.results[3].outputs.length);
            expect(callback.getContextValues().getValues()).toMatchObject(f.results[3]);

            unmount();
        });
    });

    fixtures.composeDebouncedTransaction.forEach(f => {
        it(f.description, async () => {
            require('trezor-connect').setTestFixtures(f.connect);
            const state = getInitialState();
            const store = initStore(state);
            const callback: Callback = {
                getContextValues: () => null,
            };
            const { unmount } = render(<SendFormWithProviders store={store} callback={callback} />);

            // const mocked = jest.fn(() =>
            //     f.connect ? { success: true, payload: f.connect } : { success: false },
            // );
            // const original = require('trezor-connect').composeTransaction;
            // require('trezor-connect').composeTransaction = mocked;

            const input = findByName(screen.getAllByRole('textbox'), /outputs\[.*\].amount/);
            // fireEvent.input(input[0], { target: { value: a.value } });
            await userEvent.type(input[0], f.typing.value, { delay: f.typing.delay });

            // wait for processing last composeTransaction call (useComposeDebounced timeout)
            // @ts-ignore waitFor with async
            await waitFor(async () => {
                const lastType = createDeferred();
                setTimeout(lastType.resolve, 500);
                await lastType.promise;
            });

            expect(require('trezor-connect').default.composeTransaction).toBeCalledTimes(
                f.results.connectCalledTimes,
            );

            if (f.results.composedLevels) {
                expect(callback.getContextValues().composedLevels).toMatchObject(
                    f.results.composedLevels,
                );
            } else {
                expect(callback.getContextValues().composedLevels).toBe(undefined);
            }

            unmount();
        });
    });

    it('compose', () => {});
});
