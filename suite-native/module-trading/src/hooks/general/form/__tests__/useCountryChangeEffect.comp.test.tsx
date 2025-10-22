import { TradingCountryCode } from '@suite-common/trading';
import { TestStore, initStore, renderHookWithStoreProviderAsync } from '@suite-native/test-utils';
import { selectTradingResidenceCountry } from '@suite-native/trading-residence';

import { CuntryFormWatch, useCountryChangeEffect } from '../useCountryChangeEffect';

describe('useCountryChangeEffect', () => {
    let store: TestStore;

    const renderUseCountryChangeEffect = (watch: CuntryFormWatch) =>
        renderHookWithStoreProviderAsync(() => useCountryChangeEffect(watch), { store });

    beforeEach(async () => {
        store = await initStore();
    });

    it('should do nothing on mount', async () => {
        await renderUseCountryChangeEffect(() => ({ value: 'US', label: 'United States' }));

        expect(selectTradingResidenceCountry(store.getState())).toBeUndefined();
    });

    it('should update trading residence country on country change', async () => {
        let countryValue: TradingCountryCode = 'US';
        const watch: CuntryFormWatch = () => ({ value: countryValue, label: 'Country' });

        const { rerender } = await renderUseCountryChangeEffect(watch);

        countryValue = 'CA';
        rerender({});

        expect(selectTradingResidenceCountry(store.getState())).toBe('CA');
    });
});
