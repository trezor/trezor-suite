import { combineReducers } from '@reduxjs/toolkit';

import type { StakingProductAdapter } from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductAdapter,
    mockStakingProductDescriptor,
    mockStakingProductInfo,
} from '@suite-common/earn-staking-common/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    type AccountsRootState,
    type WalletSettingsRootState,
    accountsActions,
    changeNetworks,
    initialWalletSettingsState,
} from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createStakingCompositionRoot } from '../createStakingCompositionRoot';
import { type StakingMiddlewareDeps, prepareStakingMiddleware } from './stakingMiddleware';
import { type StakingRootState, stakingReducer } from './stakingReducer';
import { selectStakingPositionsByAccount, selectStakingProductInfo } from './stakingSelectors';

type StakingMiddlewareTestState = StakingRootState & AccountsRootState & WalletSettingsRootState;

const eth = mockStakingProductDescriptor();
const ethAccount = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const btcAccount = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
const position = mockStakingPosition();

const flushThunks = () => new Promise(resolve => setTimeout(resolve, 0));

const initStore = (adapterOverrides: Partial<StakingProductAdapter> = {}) => {
    const adapter = mockStakingProductAdapter({
        descriptor: eth,
        getPosition: mock<StakingProductAdapter['getPosition']>(() => position),
        fetchProductInfo: mock<StakingProductAdapter['fetchProductInfo']>(() =>
            Promise.resolve(mockStakingProductInfo()),
        ),
        ...adapterOverrides,
    });
    let getExtra: () => StakingMiddlewareDeps = () => {
        throw new Error('Services are not composed yet');
    };
    const root = createTestCompositionRoot<StakingMiddlewareDeps, StakingMiddlewareTestState>({
        services: store => {
            const staking = createStakingCompositionRoot({
                platform: 'desktop',
                adapters: [adapter],
                dispatch: store.dispatch,
            });
            getExtra = () => ({ services: { staking } });

            return { staking };
        },
        middleware: [prepareStakingMiddleware(() => getExtra())],
        reducer: {
            staking: stakingReducer,
            wallet: combineReducers({
                accounts: (state = [ethAccount, btcAccount]) => state,
                settings: (state = initialWalletSettingsState) => state,
            }),
        },
        preloadedState: {
            wallet: {
                settings: {
                    ...initialWalletSettingsState,
                    enabledNetworks: [asNetworkSymbol('eth')],
                },
            },
        },
    });

    return { ...root.services, adapter };
};

describe('prepareStakingMiddleware', () => {
    it('syncs every account once the products are registered', async () => {
        const { store, staking, adapter } = initStore();

        staking.loadStakingProducts();
        await flushThunks();

        expect(adapter.getPosition).toHaveBeenCalledTimes(1);
        expect(adapter.getPosition).toHaveBeenCalledWith({
            account: ethAccount,
            productInfo: null,
        });
        expect(selectStakingPositionsByAccount(store.getState(), ethAccount.key)).toEqual([
            position,
        ]);
    });

    it('syncs an account that was created or updated on a network with a product', async () => {
        const { store, staking, adapter } = initStore();

        staking.loadStakingProducts();
        await flushThunks();
        jest.mocked(adapter.getPosition).mockClear();

        store.dispatch(accountsActions.updateAccount(ethAccount));
        store.dispatch(accountsActions.updateAccount(btcAccount));
        store.dispatch({
            type: accountsActions.createAccount.type,
            payload: { account: ethAccount, supportedNetworks: [asNetworkSymbol('eth')] },
        });
        await flushThunks();

        expect(adapter.getPosition).toHaveBeenCalledTimes(2);
    });

    it('refreshes the product info when the enabled networks change, then re-syncs', async () => {
        const { store, staking, adapter } = initStore();

        staking.loadStakingProducts();
        await flushThunks();
        jest.mocked(adapter.getPosition).mockClear();

        store.dispatch(changeNetworks([asNetworkSymbol('eth')], [asNetworkSymbol('eth')]));
        await flushThunks();

        expect(adapter.fetchProductInfo).toHaveBeenCalledTimes(1);
        expect(selectStakingProductInfo(store.getState(), eth.id)).toEqual(
            mockStakingProductInfo(),
        );
        expect(adapter.getPosition).toHaveBeenCalledWith({
            account: ethAccount,
            productInfo: mockStakingProductInfo(),
        });
    });
});
