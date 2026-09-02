import { combineReducers } from '@reduxjs/toolkit';

import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { createTestStore, wireEnabledNetworksMock } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { walletSettingsFixtures } from './__fixtures__/walletSettingsActions.fixtures';
import { prepareWalletSettingsReducer } from './walletSettingsReducer';
import { changeCoinVisibilityThunk } from './walletSettingsThunks';

const btcSymbol = asNetworkSymbol('btc');
const adaSymbol = asNetworkSymbol('ada');

const settingsReducer = prepareWalletSettingsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadWalletSettings: mockReducer() },
});

const initStore = (state: any) =>
    createTestStore({
        extra: undefined,
        reducer: {
            wallet: combineReducers({
                settings: settingsReducer,
            }),
        },
        preloadedState: { wallet: { settings: state } },
    });

describe('walletSettings Actions', () => {
    walletSettingsFixtures.forEach(f => {
        it(f.description, async () => {
            const store = initStore(f.initialState);
            // changeCoinVisibility awaits updateConnectSettings; mock it as a no-op success.
            wireEnabledNetworksMock();
            await store.dispatch(f.action() as any);
            expect(store.getState().wallet.settings).toMatchObject(f.result);
        });
    });

    describe('changeCoinVisibility declares the enabled coin to Connect', () => {
        it('pushes the coin when enabling a not-yet-enabled network', async () => {
            const store = initStore({ enabledNetworks: [btcSymbol] });
            const { updateConnectSettings } = wireEnabledNetworksMock();

            await store.dispatch(
                changeCoinVisibilityThunk({
                    symbol: adaSymbol,
                    shouldBeVisible: true,
                }) as any,
            );

            expect(updateConnectSettings).toHaveBeenCalledTimes(1);
            expect(updateConnectSettings).toHaveBeenCalledWith({
                enabledNetworks: [{ coin: 'ada' }],
            });
        });

        it('does not call Connect when disabling a coin (disable is one-way, not propagated)', async () => {
            const store = initStore({ enabledNetworks: [btcSymbol, adaSymbol] });
            const { updateConnectSettings } = wireEnabledNetworksMock();

            await store.dispatch(
                changeCoinVisibilityThunk({
                    symbol: adaSymbol,
                    shouldBeVisible: false,
                }) as any,
            );

            expect(updateConnectSettings).not.toHaveBeenCalled();
        });

        it('does not call Connect when the coin is already enabled', async () => {
            const store = initStore({ enabledNetworks: [btcSymbol, adaSymbol] });
            const { updateConnectSettings } = wireEnabledNetworksMock();

            await store.dispatch(
                changeCoinVisibilityThunk({
                    symbol: adaSymbol,
                    shouldBeVisible: true,
                }) as any,
            );

            expect(updateConnectSettings).not.toHaveBeenCalled();
        });

        it('updates Redux immediately, without waiting for the Connect declaration', async () => {
            const store = initStore({ enabledNetworks: [btcSymbol] });
            // Hold the Connect call open: the Redux/UI toggle must NOT block on it.
            const TrezorConnect = require('@trezor/connect').default;
            let resolveUpdate: (value: unknown) => void = () => {};
            TrezorConnect.updateConnectSettings = jest.fn(
                () =>
                    new Promise(resolve => {
                        resolveUpdate = resolve;
                    }),
            );

            const dispatched = store.dispatch(
                changeCoinVisibilityThunk({
                    symbol: adaSymbol,
                    shouldBeVisible: true,
                }) as any,
            );

            // Redux already reflects the toggle even though Connect hasn't confirmed.
            expect(store.getState().wallet.settings.enabledNetworks).toContain('ada');

            resolveUpdate({ success: true, payload: { message: 'success' } });
            await dispatched;
        });
    });
});
