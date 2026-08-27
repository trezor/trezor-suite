import { combineReducers } from '@reduxjs/toolkit';

import { type TradingCountryCode } from '@suite-common/trading';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { Form } from '@suite-native/forms';
import { localeReducer } from '@suite-native/intl';
import { renderHookWithBasicProvider } from '@suite-native/test-utils';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { residenceReducer } from '@suite-native/trading-state';

import { useFormCountryCode } from './useFormCountryCode';
import { useLocationForm } from './useLocationForm';
import { type TradingLocationFormType } from '../types/tradingLocationForm';

describe('useFormCountryCode', () => {
    const renderLocationForm = async () =>
        await renderHookWithStoreProvider(() => useLocationForm(), {
            store: createLightStore({
                reducer: {
                    locale: localeReducer,
                    wallet: combineReducers({
                        settings: createStaticReducer(initialWalletSettingsState),
                        trading: combineReducers({
                            residence: residenceReducer,
                        }),
                    }),
                },
            }),
        });

    const renderUseFormCountryCode = async (locationForm: TradingLocationFormType) =>
        await renderHookWithBasicProvider(() => useFormCountryCode(), {
            wrapper: ({ children }) => <Form form={locationForm}>{children}</Form>,
        });

    it.each<TradingCountryCode>(['US', 'unknown'])(
        'should reflect country for %s',
        async country => {
            const { result: formResult } = await renderLocationForm();

            await act(() => {
                formResult.current.setValue('country', {
                    value: country,
                    codeAlpha3: 'USA',
                    flag: 'Flag',
                    name: 'Country long name',
                    label: 'Country label',
                    shortLabel: 'Short label',
                });
            });
            const { result } = await renderUseFormCountryCode(formResult.current);

            expect(result.current).toEqual(country);
        },
    );
});
