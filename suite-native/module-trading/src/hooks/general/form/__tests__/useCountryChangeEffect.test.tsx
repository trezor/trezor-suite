import { TradingCountryCode, TradingCountryOption } from '@suite-common/trading';
// eslint-disable-next-line local-rules/no-package-deep-imports
import {
    TestStore,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils/store';
import { selectTradingResidenceCountry } from '@suite-native/trading-state';

import { CountryFormWatch, useCountryChangeEffect } from '../useCountryChangeEffect';

describe('useCountryChangeEffect', () => {
    let store: TestStore;

    const renderUseCountryChangeEffect = (watch: CountryFormWatch) =>
        renderHookWithStoreProviderAsync(() => useCountryChangeEffect(watch), { store });

    beforeEach(() => {
        store = initStore().store;
    });

    it('should do nothing on mount', async () => {
        await renderUseCountryChangeEffect(() => ({
            codeAlpha3: 'USA',
            flag: '🇺🇸',
            name: 'United States of America',
            value: 'US',
            label: '🇺🇸 United States',
            shortLabel: '🇺🇸 USA',
        }));

        expect(selectTradingResidenceCountry(store.getState())).toBeUndefined();
    });

    it('should update trading residence country on country change', async () => {
        let countryValue: TradingCountryCode = 'US';
        const watch: CountryFormWatch = () => ({
            value: countryValue,
            codeAlpha3: 'USA',
            flag: 'Flag',
            name: 'Country long name',
            label: 'Country label',
            shortLabel: 'Short label',
        });

        const { rerender } = await renderUseCountryChangeEffect(watch);

        countryValue = 'CA';
        rerender({});

        expect(selectTradingResidenceCountry(store.getState())).toBe('CA');
    });

    it('should not update when country becomes undefined', async () => {
        let countryOption: TradingCountryOption | undefined = {
            codeAlpha3: 'USA',
            flag: '🇺🇸',
            name: 'United States of America',
            value: 'US',
            label: '🇺🇸 United States',
            shortLabel: '🇺🇸 USA',
        };
        const watch: CountryFormWatch = () => countryOption;
        const { rerender } = await renderUseCountryChangeEffect(watch);

        countryOption = undefined;
        rerender({});

        expect(selectTradingResidenceCountry(store.getState())).toBeUndefined();
    });
});
