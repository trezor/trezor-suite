import { configureStore, Store } from '@reduxjs/toolkit';

import { fiatCurrencies } from '@suite-common/suite-config';

import { appSettingsReducer, setColorScheme, setFiatCurrency } from '../slice';

const store: Store = configureStore({
    reducer: {
        appSettings: appSettingsReducer,
    },
});

describe('change color scheme', () => {
    const state = store.getState().appSettings;

    it('loads initial state correctly', () => {
        expect(state.colorScheme).toEqual('system');
    });
    it('changes color scheme', () => {
        const { payload } = store.dispatch(setColorScheme('dark'));
        expect(payload).toEqual('dark');
    });
});

describe('change fiat currency', () => {
    const state = store.getState().appSettings;

    it('loads initial state correctly', () => {
        expect(state.fiatCurrency).toEqual(fiatCurrencies.usd);
    });
    it('changes fiat currency', () => {
        const { payload } = store.dispatch(setFiatCurrency('czk'));
        const fiatCurrency = payload;

        expect(fiatCurrency).toEqual(fiatCurrencies[fiatCurrency].label);
    });
});
