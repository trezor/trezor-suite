import { TestStore, initStore, renderHookWithStoreProviderAsync } from '@suite-native/test-utils';
import { buyMercuryo, getWalletState } from '@suite-native/trading-fixtures';
import { selectTradingProviderMetadata } from '@suite-native/trading-state';

import {
    QuoteProviderFormWatch,
    useProviderMetadataChangeEffect,
} from '../useProviderMetadataChangeEffect';

describe('useProviderMetadataChangeEffect', () => {
    let store: TestStore;

    const renderUseProviderMetadataChangeEffect = (watch: QuoteProviderFormWatch) =>
        renderHookWithStoreProviderAsync(() => useProviderMetadataChangeEffect(watch, 'buy'), {
            store,
        });

    beforeEach(() => {
        ({ store } = initStore({ wallet: getWalletState({ tradeType: 'buy' }) }));
    });

    it('should set currentProviderMetadata when quote is set', async () => {
        await renderUseProviderMetadataChangeEffect(_ => 'mercuryo');

        expect(selectTradingProviderMetadata(store.getState())).toEqual(buyMercuryo);
    });

    it('should clear currentProviderMetadata on unmount', async () => {
        const { unmount } = await renderUseProviderMetadataChangeEffect(_ => 'mercuryo');

        unmount();

        expect(selectTradingProviderMetadata(store.getState())).toBeUndefined();
    });
});
