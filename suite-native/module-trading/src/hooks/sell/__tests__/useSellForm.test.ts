import { tradingSellActions } from '@suite-common/trading';
import {
    PreloadedState,
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getBtcAccount } from '../../../__fixtures__/account';
import { getWalletState } from '../../../__fixtures__/walletState';
import { useSellForm } from '../useSellForm';

describe('useSellForm', () => {
    const renderUseSellForm = (store: TestStore) =>
        renderHookWithStoreProviderAsync(() => useSellForm(), { store });

    const getInitializedStore = async () => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'sell' }),
        };

        return await initStore(preloadedState);
    };

    describe('sendAccount', () => {
        it('should be undefined by default', async () => {
            const store = await getInitializedStore();
            const { result } = await renderUseSellForm(store);

            expect(result.current.getValues('sendAccount')).toBeUndefined();
        });

        it('should update sendAccount value when account in redux store is changed', async () => {
            const store = await getInitializedStore();
            const { result } = await renderUseSellForm(store);

            act(() => {
                store.dispatch(tradingSellActions.setTradingAccountKey('btc-account-1'));
            });

            expect(result.current.getValues('sendAccount')).toEqual(getBtcAccount('btc-account-1'));
        });
    });
});
