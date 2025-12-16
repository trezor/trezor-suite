import { TradingCountryCode, TradingCountryOption } from '@suite-common/trading';
import { TestStore, initStore, renderHookWithStoreProviderAsync } from '@suite-native/test-utils';
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
        await renderUseCountryChangeEffect(() => ({ value: 'US', label: 'United States' }));

        expect(selectTradingResidenceCountry(store.getState())).toBeUndefined();
    });

    it('should update trading residence country on country change', async () => {
        let countryValue: TradingCountryCode = 'US';
        const watch: CountryFormWatch = () => ({ value: countryValue, label: 'Country' });

        const { rerender } = await renderUseCountryChangeEffect(watch);

        countryValue = 'CA';
        rerender({});

        expect(selectTradingResidenceCountry(store.getState())).toBe('CA');
    });

    it('should not update when country becomes undefined', async () => {
        let countryOption: TradingCountryOption | undefined = { value: 'US', label: 'Country' };
        const watch: CountryFormWatch = () => countryOption;
        const { rerender } = await renderUseCountryChangeEffect(watch);

        countryOption = undefined;
        rerender({});

        expect(selectTradingResidenceCountry(store.getState())).toBeUndefined();
    });
});
