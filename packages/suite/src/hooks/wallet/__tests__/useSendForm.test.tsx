/* eslint-disable global-require */
import React from 'react';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { render, fireEvent, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SendContext, useSendForm } from '../useSendForm';
import * as fixtures from '../__fixtures__/useSendForm';
import sendFormReducer from '@wallet-reducers/sendFormReducer';

import Outputs from '@wallet-views/send/components/Outputs';
import Header from '@wallet-views/send/components/Header';
// import OpReturn from '@wallet-views/send/components/OpReturn';
import Fees from '@wallet-views/send/components/Fees';
import CoinActions from '@wallet-views/send/components/CoinActions';
import TotalSent from '@wallet-views/send/components/TotalSent';
import ReviewButton from '@wallet-views/send/components/ReviewButton';

jest.mock('react-svg', () => {
    return {
        ReactSVG: () => {
            // console.log('ReactSVG', props, props.src);
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

jest.mock('trezor-connect', () => {
    let fixture: any;
    let fixtureIndex = 0;
    return {
        __esModule: true, // this property makes it work
        default: {
            composeTransaction: jest.fn(async params => {
                if (!fixture) return { success: false };
                const f = Array.isArray(fixture) ? fixture[fixtureIndex] : fixture;
                if (!f) return { success: false };
                if (typeof f.delay === 'number') {
                    await new Promise(resolve => setTimeout(resolve, f.delay));
                }
                fixtureIndex++;
                return f.response;
            }),
            blockchainEstimateFee: () =>
                fixture || {
                    success: false,
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

export const getInitialState = (state?: any) => {
    return {
        suite: { device: {}, settings: { debug: {} } },
        labeling: {}, // will not be used in the future
        wallet: {
            accounts: [],
            selectedAccount: {
                status: 'loaded',
                account: {
                    symbol: 'btc',
                    networkType: 'bitcoin',
                    descriptor: 'xpub',
                    deviceState: 'deviceState',
                    addresses: { change: [], used: [], unused: [] },
                    availableBalance: '100000000000',
                    utxo: [],
                },
                network: { networkType: 'bitcoin', symbol: 'btc', decimals: 8 },
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
                        current: {
                            symbol: 'btc',
                            ts: 0,
                            rates: { usd: 1, eur: 1.2, czk: 22 },
                        },
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

const Index = ({ callback, store }: any) => {
    const { account, network } = store.wallet.selectedAccount;
    const sendFormContext = useSendForm({
        account,
        network,
        localCurrencyOption: { value: 'usd', label: 'USD' },
        feeInfo: {
            minFee: 1,
            maxFee: 100,
            blockHeight: 1,
            blockTime: 1,
            levels: [
                { label: 'normal', feePerUnit: '4', blocks: 1 },
                { label: 'custom', feePerUnit: '-1', blocks: -1 },
            ],
        },
        fiatRates: store.wallet.fiat.coins.find(item => item.symbol === account.symbol),
    });

    callback.getContextValues = () => {
        return sendFormContext;
    };

    return (
        <SendContext.Provider value={sendFormContext}>
            {sendFormContext.isLoading && <div>Loading</div>}
            <Header setOpReturnActive={() => false} />
            <Outputs />
            <CoinActions />
            {/* {networkType === 'bitcoin' && opReturnActive && (
                <OpReturn setIsActive={setOpReturnActive} />
            )} */}
            <Fees />
            <TotalSent />
            <ReviewButton />
        </SendContext.Provider>
    );
};

const renderWithCallback = (store: any) => {
    const callback: Callback = {
        getContextValues: () => null,
    };
    const renderMethods = render(
        <Provider store={store}>
            <IntlProvider locale="en">
                <Index callback={callback} store={store.getState()} />
            </IntlProvider>
        </Provider>,
    );
    return {
        ...renderMethods,
        callback,
    };
};

const waitForLoader = () => {
    const loading = screen.queryByText(/Loading/i);
    if (loading) {
        console.warn('---GOT LOADER?');
        return waitForElementToBeRemoved(() => screen.getByText(/Loading/i));
    }
};
interface Query {
    (id: string): HTMLElement;
    (id: RegExp): HTMLElement[];
}

const findByTestId: Query = id => {
    if (typeof id === 'string') {
        return screen.getByText((_, element) => {
            const attrValue = element.getAttribute('data-test');
            return attrValue ? attrValue === id : false;
        });
    }
    return screen.getAllByText((_, element) => {
        const attrValue = element.getAttribute('data-test');
        return attrValue ? id.test(attrValue) : false;
    });
};

describe('useSendForm hook', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    fixtures.addingOutputs.forEach(f => {
        it(f.description, async () => {
            const state = getInitialState(f.state);
            const store = initStore(state);
            const { unmount, callback } = renderWithCallback(store);

            // wait for compose
            await waitForLoader();

            expect(findByTestId(/outputs\[.*\].address/).length).toBe(f.initial.outputs.length);
            expect(callback.getContextValues().getValues()).toMatchObject(f.initial);

            for (let i = 0; i < f.actions.length; i++) {
                const a = f.actions[i];
                const button = findByTestId(a.button);
                fireEvent.click(button); // TODO: why it doesn't work with userEvent?
                // wait for compose
                // eslint-disable-next-line no-await-in-loop
                await waitForLoader();
                expect(findByTestId(/outputs\[.*\].address/).length).toBe(a.result.outputs.length);
                expect(callback.getContextValues().getValues()).toMatchObject(a.result);
            }

            unmount();
        });
    });

    fixtures.setMax.forEach(f => {
        it(f.description, async () => {
            require('trezor-connect').setTestFixtures(f.connect);
            const state = getInitialState(f.state);
            const store = initStore(state);
            const { unmount, callback } = renderWithCallback(store);

            // wait for compose
            await waitForLoader();
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
            const state = getInitialState();
            const store = initStore(state);
            const { unmount, callback } = renderWithCallback(store);

            await userEvent.type(findByTestId(f.typing.element), f.typing.value, {
                delay: f.typing.delay,
            });

            // wait for compose
            await waitForLoader();

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
});
