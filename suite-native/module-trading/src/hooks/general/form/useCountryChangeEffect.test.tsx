import { combineReducers } from '@reduxjs/toolkit';

import { mockActionType } from '@suite-common/redux-utils/mocks';
import {
    type TradingCountryCode,
    type TradingCountryOption,
    type TradingCountrySubdivisionOption,
} from '@suite-common/trading';
import { yup } from '@suite-common/validators';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { useForm } from '@suite-native/forms';
import { localeReducer } from '@suite-native/intl';
import { act } from '@suite-native/test-utils';
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

import { useCountryChangeEffect } from './useCountryChangeEffect';

type CountryFormValues = {
    country: TradingCountryOption | undefined;
    countrySubdivision: TradingCountrySubdivisionOption | undefined;
};

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
            trading: tradingSlice.prepareReducer({
                actionTypes: { storageLoad: mockActionType('storageLoad') },
            }),
        }),
    } as const;

    const renderUseCountryChangeEffect = async (defaultValues: CountryFormValues) =>
        await renderHookWithStoreProvider(
            () => {
                const form = useForm<CountryFormValues>({
                    defaultValues,
                    validation: yup.object({}),
                });
                useCountryChangeEffect(form.control);

                return form;
            },
            { store },
        );

    beforeEach(() => {
        store = createLightStore({ reducer });
    });

    it('should do nothing on mount', async () => {
        await renderUseCountryChangeEffect({
            country: buildCountryOption('US'),
            countrySubdivision: undefined,
        });

        expect(selectTradingResidenceCountry(store.getState())).toBeUndefined();
    });

    it('should update trading residence country on country change', async () => {
        const { result } = await renderUseCountryChangeEffect({
            country: buildCountryOption('US'),
            countrySubdivision: undefined,
        });

        await act(() => result.current.setValue('country', buildCountryOption('CA')));

        expect(selectTradingResidenceCountry(store.getState())).toBe('CA');
        expect(selectTradingResidenceCountrySubdivision(store.getState())).toBeUndefined();
    });

    it('should not update when country becomes undefined', async () => {
        const { result } = await renderUseCountryChangeEffect({
            country: buildCountryOption('US'),
            countrySubdivision: undefined,
        });

        await act(() => result.current.setValue('country', undefined));

        expect(selectTradingResidenceCountry(store.getState())).toBeUndefined();
    });

    it('should update trading residence country subdivision on subdivision change', async () => {
        const { result } = await renderUseCountryChangeEffect({
            country: buildCountryOption('US'),
            countrySubdivision: {
                value: 'CA',
                label: 'California',
                name: 'California',
            },
        });

        await act(() =>
            result.current.setValue('countrySubdivision', {
                value: 'NY',
                label: 'New York',
                name: 'New York',
            }),
        );

        expect(selectTradingResidenceCountry(store.getState())).toBe('US');
        expect(selectTradingResidenceCountrySubdivision(store.getState())).toBe('NY');
    });
});
