import { combineReducers } from '@reduxjs/toolkit';

import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import {
    type TradingCountryCode,
    type TradingCountryOption,
    type TradingCountrySubdivisionOption,
} from '@suite-common/trading';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { localeReducer } from '@suite-native/intl';
import {
    type TestStore,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import {
    selectTradingResidenceCountry,
    selectTradingResidenceCountrySubdivision,
    tradingSlice,
} from '@suite-native/trading-state';

import {
    type CountrySubdivisionFormWatch,
    useCountryChangeEffect,
} from '../useCountryChangeEffect';

const buildCountryOption = (value: TradingCountryCode): TradingCountryOption => ({
    codeAlpha3: 'USA',
    flag: '🇺🇸',
    name: 'United States of America',
    value,
    label: '🇺🇸 United States',
    shortLabel: '🇺🇸 USA',
});

describe('useCountryChangeEffect', () => {
    let store: TestStore;

    const reducer = {
        locale: localeReducer,
        wallet: combineReducers({
            settings: createStaticReducer(initialWalletSettingsState),
            trading: tradingSlice.prepareReducer(extraDependenciesCommonMock),
        }),
    } as const;

    const renderUseCountryChangeEffect = (watch: CountrySubdivisionFormWatch) =>
        renderHookWithStoreProvider(() => useCountryChangeEffect(watch), { store });

    beforeEach(() => {
        store = createLightStore({ reducer });
    });

    it('should do nothing on mount', () => {
        renderUseCountryChangeEffect(() => [buildCountryOption('US'), undefined]);

        expect(selectTradingResidenceCountry(store.getState())).toBeUndefined();
    });

    it('should update trading residence country on country change', () => {
        let countryValue: TradingCountryCode = 'US';
        const watch: CountrySubdivisionFormWatch = () => [
            buildCountryOption(countryValue),
            undefined,
        ];

        const { rerender } = renderUseCountryChangeEffect(watch);

        countryValue = 'CA';
        rerender({});

        expect(selectTradingResidenceCountry(store.getState())).toBe('CA');
        expect(selectTradingResidenceCountrySubdivision(store.getState())).toBeUndefined();
    });

    it('should not update when country becomes undefined', () => {
        let countryOption: TradingCountryOption | undefined = buildCountryOption('US');
        const watch: CountrySubdivisionFormWatch = () => [countryOption, undefined];
        const { rerender } = renderUseCountryChangeEffect(watch);

        countryOption = undefined;
        rerender({});

        expect(selectTradingResidenceCountry(store.getState())).toBeUndefined();
    });

    it('should update trading residence country subdivision on subdivision change', () => {
        let countrySubdivision: TradingCountrySubdivisionOption | undefined = {
            value: 'CA',
            label: 'California',
            name: 'California',
        };
        const watch: CountrySubdivisionFormWatch = () => [
            buildCountryOption('US'),
            countrySubdivision,
        ];

        const { rerender } = renderUseCountryChangeEffect(watch);

        countrySubdivision = {
            value: 'NY',
            label: 'New York',
            name: 'New York',
        };
        rerender({});

        expect(selectTradingResidenceCountry(store.getState())).toBe('US');
        expect(selectTradingResidenceCountrySubdivision(store.getState())).toBe('NY');
    });
});
