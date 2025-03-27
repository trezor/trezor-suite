import { Account } from '@suite-common/wallet-types';
import {
    PreloadedState,
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { btcAsset, usdcAsset } from '../../__fixtures__/tradeableAssets';
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
            result.current.setValue('asset', undefined as unknown as TradeableAsset);
        });

        expect(result.current.getValues('receiveAccount')).toEqual({ account: { key: 'btc2' } });
    });

    it('should clear crypto amount on coin change', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('asset', btcAsset);
            result.current.setValue('cryptoValue', '10');
            result.current.setValue('asset', usdcAsset);
        });

        expect(result.current.getValues('cryptoValue')).toBeUndefined();
    });

    it('should clear crypto amount on fiat currency change', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('cryptoValue', '10');
            result.current.setValue('fiatCurrency', 'eur');
        });

        expect(result.current.getValues('cryptoValue')).toBeUndefined();
    });

    it('should clear fiat amount on fiat currency change', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('fiatValue', '10');
            result.current.setValue('fiatCurrency', 'eur');
        });

        expect(result.current.getValues('fiatValue')).toBeUndefined();
    });

    it('should clear cryptoValue when user edits fiatValue', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('cryptoValue', '10');
            result.current.setValue('focusedValue', 'fiatValue');
            result.current.setValue('fiatValue', '10');
        });

        expect(result.current.getValues('cryptoValue')).toBeUndefined();
        expect(result.current.getValues('fiatValue')).toEqual('10');
    });

    it('should clear fiatValue when user edits cryptoValue', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('fiatValue', '10');
            result.current.setValue('focusedValue', 'cryptoValue');
            result.current.setValue('cryptoValue', '10');
        });

        expect(result.current.getValues('fiatValue')).toBeUndefined();
        expect(result.current.getValues('cryptoValue')).toEqual('10');
    });
});
