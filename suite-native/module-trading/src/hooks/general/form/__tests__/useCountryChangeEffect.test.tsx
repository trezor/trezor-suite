import { combineReducers } from '@reduxjs/toolkit';

import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { type TradingCountryCode, type TradingCountryOption } from '@suite-common/trading';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { localeReducer } from '@suite-native/intl';
import {
    type TestStore,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { selectTradingResidenceCountry, tradingSlice } from '@suite-native/trading-state';

import { type CountryFormWatch, useCountryChangeEffect } from '../useCountryChangeEffect';

describe('useCountryChangeEffect', () => {
    let store: TestStore;

    const reducer = {
        locale: localeReducer,
        wallet: combineReducers({
            settings: createStaticReducer(initialWalletSettingsState),
            trading: tradingSlice.prepareReducer(extraDependenciesCommonMock),
        }),
    } as const;

    const renderUseCountryChangeEffect = (watch: CountryFormWatch) =>
        renderHookWithStoreProvider(() => useCountryChangeEffect(watch), {
            store,
            providers: [],
        });

    beforeEach(() => {
        store = createLightStore({ reducer });
    });

    it('should do nothing on mount', () => {
        renderUseCountryChangeEffect(() => ({
            codeAlpha3: 'USA',
            flag: '🇺🇸',
            name: 'United States of America',
            value: 'US',
            label: '🇺🇸 United States',
            shortLabel: '🇺🇸 USA',
        }));

        expect(selectTradingResidenceCountry(store.getState())).toBeUndefined();
    });

    it('should update trading residence country on country change', () => {
        let countryValue: TradingCountryCode = 'US';
        const watch: CountryFormWatch = () => ({
            value: countryValue,
            codeAlpha3: 'USA',
            flag: 'Flag',
            name: 'Country long name',
            label: 'Country label',
            shortLabel: 'Short label',
        });

        const { rerender } = renderUseCountryChangeEffect(watch);

        countryValue = 'CA';
        rerender({});

        expect(selectTradingResidenceCountry(store.getState())).toBe('CA');
    });

    it('should not update when country becomes undefined', () => {
        let countryOption: TradingCountryOption | undefined = {
            codeAlpha3: 'USA',
            flag: '🇺🇸',
            name: 'United States of America',
            value: 'US',
            label: '🇺🇸 United States',
            shortLabel: '🇺🇸 USA',
        };
        const watch: CountryFormWatch = () => countryOption;
        const { rerender } = renderUseCountryChangeEffect(watch);

        countryOption = undefined;
        rerender({});

        expect(selectTradingResidenceCountry(store.getState())).toBeUndefined();
    });
});
