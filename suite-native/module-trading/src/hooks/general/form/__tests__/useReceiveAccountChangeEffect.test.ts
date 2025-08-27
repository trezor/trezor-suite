import { tradingExchangeActions } from '@suite-common/trading';
import {
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getBtcAccount } from '../../../../__fixtures__/account';
import { getWalletState } from '../../../../__fixtures__/walletState';
import { selectExchangeSelectedReceiveAccount } from '../../../../selectors/exchangeSelectors';
import { useReceiveAccountChangeEffect } from '../useReceiveAccountChangeEffect';

describe('useReceiveAccountChangeEffect', () => {
    let store: TestStore;
    let setValue: jest.Mock;

    const renderUseReceiveAccountChangeEffect = () =>
        renderHookWithStoreProviderAsync(
            () => useReceiveAccountChangeEffect(setValue, selectExchangeSelectedReceiveAccount),
            { store },
        );

    beforeEach(async () => {
        const preloadState = { wallet: getWalletState({ tradeType: 'exchange' }) };
        store = await initStore(preloadState);
        setValue = jest.fn();
    });

    it('should set receiveAccount based on store value', async () => {
        await renderUseReceiveAccountChangeEffect();

        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValue).toHaveBeenCalledWith('receiveAccount', undefined);
    });

    it('should set receiveAccount on change', async () => {
        await renderUseReceiveAccountChangeEffect();

        setValue.mockClear();
        act(() => {
            store.dispatch(tradingExchangeActions.setReceiveAccountKey('btc-account-1'));
        });

        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValue).toHaveBeenCalledWith('receiveAccount', {
            account: getBtcAccount('btc-account-1'),
            address: undefined,
        });
    });
});
