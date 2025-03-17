import { Account } from '@suite-common/wallet-types';
import {
    PreloadedState,
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { usdcAsset } from '../../__fixtures__/tradeableAssets';
import { getInitializedTradingState } from '../../__fixtures__/tradingState';
import { setBuySelectedReceiveAccount } from '../../tradingSlice';
import { TradeableAsset } from '../../types';
import { useTradingBuyForm } from '../useTradingBuyForm';

describe('useTradingBuyForm', () => {
    const renderUseTradingBuyForm = (store: TestStore) =>
        renderHookWithStoreProviderAsync(() => useTradingBuyForm(), { store });

    const getInitializedStore = async () => {
        const preloadedState: PreloadedState = {
            wallet: { tradingNew: getInitializedTradingState() },
        };
        preloadedState.wallet!.tradingNew!.buy!.selectedReceiveAccount = {
            account: { key: 'btc1' } as Account,
        };

        return await initStore(preloadedState);
    };

    it('should clear receive account in redux on mount', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        expect(result.current.getValues('receiveAccount')).toBeUndefined();
        expect(store.getState().wallet.tradingNew.buy.selectedReceiveAccount).toBeUndefined();
    });

    it('should update form value when account in redux store is changed', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            store.dispatch(
                setBuySelectedReceiveAccount({
                    selectedReceiveAccount: { account: { key: 'btc2' } as Account },
                }),
            );
        });

        expect(result.current.getValues('receiveAccount')).toEqual({ account: { key: 'btc2' } });
    });

    it('should clear selected account on asset network change', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            store.dispatch(
                setBuySelectedReceiveAccount({
                    selectedReceiveAccount: { account: { key: 'btc2' } as Account },
                }),
            );
        });

        act(() => {
            result.current.setValue('asset', usdcAsset);
        });

        expect(result.current.getValues('receiveAccount')).toBeUndefined();
    });

    it('should not clear selected account when asset is set to undefined', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            store.dispatch(
                setBuySelectedReceiveAccount({
                    selectedReceiveAccount: { account: { key: 'btc2' } as Account },
                }),
            );
        });

        act(() => {
            result.current.setValue('asset', undefined as unknown as TradeableAsset);
        });

        expect(result.current.getValues('receiveAccount')).toEqual({ account: { key: 'btc2' } });
    });
});
