import type { StakingProductAdapter } from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductAdapter,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { type QueryClientDep, createQueryClient } from '@suite-common/react-query';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { asGetter, mock } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createStakingCompositionRoot } from './createStakingCompositionRoot';
import type { StakingDep } from './stakingServices';
import { type StakingRootState, stakingReducer } from './state/stakingReducer';
import {
    selectStakingPlatform,
    selectStakingPositionsByAccount,
    selectStakingProductDescriptors,
} from './state/stakingSelectors';

type StakingCompositionRootTestState = StakingRootState;

const position = mockStakingPosition();
const ethAdapter = mockStakingProductAdapter({
    getPosition: mock<StakingProductAdapter['getPosition']>(() => position),
});
const solAdapter = mockStakingProductAdapter({
    descriptor: mockStakingProductDescriptor({ symbol: asNetworkSymbol('sol'), type: 'native' }),
});
const ethAccount = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const btcAccount = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
const accounts = [ethAccount, btcAccount];

const flushThunks = () => new Promise(resolve => setTimeout(resolve, 0));

const initStore = (adapters: readonly StakingProductAdapter[]) => {
    const root = createTestCompositionRoot<
        { services: StakingDep & QueryClientDep },
        StakingCompositionRootTestState
    >({
        services: store => ({
            queryClient: createQueryClient({ shouldRefetchOnEvents: false }),
            staking: createStakingCompositionRoot({
                platform: 'mobile',
                adapters,
                dispatch: store.dispatch,
                getAccounts: asGetter(() => accounts),
                getAccountByKey: asGetter(
                    accountKey => accounts.find(account => account.key === accountKey) ?? null,
                ),
                getEnabledNetworks: asGetter(() => []),
            }),
        }),
        reducer: {
            staking: stakingReducer,
        },
    });

    return root.services;
};

describe('createStakingCompositionRoot', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('registers the adapters in the repository', () => {
        const { staking } = initStore([ethAdapter, solAdapter]);

        expect(staking.stakingProductRepository.list()).toEqual([ethAdapter, solAdapter]);
    });

    it('loads the platform and the descriptors into the store', () => {
        const { store, staking } = initStore([ethAdapter, solAdapter]);

        staking.loadStakingProducts();

        expect(selectStakingPlatform(store.getState())).toBe('mobile');
        expect(selectStakingProductDescriptors(store.getState())).toEqual([
            ethAdapter.descriptor,
            solAdapter.descriptor,
        ]);
    });

    it('syncs the positions of every account with a product once loaded', async () => {
        const { store, staking } = initStore([ethAdapter, solAdapter]);

        staking.loadStakingProducts();
        await flushThunks();

        expect(ethAdapter.getPosition).toHaveBeenCalledTimes(1);
        expect(ethAdapter.getPosition).toHaveBeenCalledWith({
            account: ethAccount,
            productInfo: null,
        });
        expect(selectStakingPositionsByAccount(store.getState(), ethAccount.key)).toEqual([
            position,
        ]);
    });

    it('loads no descriptors without adapters', () => {
        const { store, staking } = initStore([]);

        staking.loadStakingProducts();

        expect(selectStakingProductDescriptors(store.getState())).toEqual([]);
    });
});
