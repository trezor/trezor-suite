import { combineReducers } from '@reduxjs/toolkit';

import { type TradingCountryCode } from '@suite-common/trading';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { Form } from '@suite-native/forms';
import { localeReducer } from '@suite-native/intl';
import { renderHookWithProviders } from '@suite-native/test-utils';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { residenceReducer } from '@suite-native/trading-state';

import { type TradingLocationFormType } from '../../types/tradingLocationForm';
import { useFormCountryCode } from '../useFormCountryCode';
import { useLocationForm } from '../useLocationForm';

describe('useFormCountryCode', () => {
    const renderLocationForm = () =>
        renderHookWithStoreProvider(() => useLocationForm(), {
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

    const renderUseFormCountryCode = (locationForm: TradingLocationFormType) =>
        renderHookWithProviders(() => useFormCountryCode(), {
            providers: ['intl'],
            wrapper: ({ children }) => <Form form={locationForm}>{children}</Form>,
        });

    it.each<TradingCountryCode>(['US', 'unknown'])('should reflect country for %s', country => {
        const { result: formResult } = renderLocationForm();

        act(() => {
            formResult.current.setValue('country', {
                value: country,
                codeAlpha3: 'USA',
                flag: 'Flag',
                name: 'Country long name',
                label: 'Country label',
                shortLabel: 'Short label',
            });
        });
        const { result } = renderUseFormCountryCode(formResult.current);

        expect(result.current).toEqual(country);
    });
});
