import '@suite-common/test-utils/globalOverrides';

import { type StakingDep } from '@suite-common/earn-staking';
import { mockStakingQueryClient, mockStakingServices } from '@suite-common/earn-staking/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type Account } from '@suite-common/wallet-types';

import {
    BTC,
    ETH,
    createEarnStakingTableState,
    mockAccount,
} from '#src/components/earn/dashboard/staking/earnStakingTableTestState';
import { renderHookWithProviders } from '#src/support/test-utils/hooksHelper';

import { useTradeBoxEarnOptions } from './useTradeBoxEarnOptions';
import { type MockSuiteState } from '../../../../../../mocks/mockInitialAppState';

// The staking gate is under test; the yield vaults are a query of their own.
jest.mock('@suite-common/earn-stablecoin', () => ({
    ...jest.requireActual('@suite-common/earn-stablecoin'),
    useNativeYieldVault: () => ({ hasYieldOption: false, bestVault: null }),
}));

type RenderParams = Pick<
    NonNullable<Parameters<typeof createEarnStakingTableState>[0]>,
    'descriptors'
>;

const renderEarnOptions = (account: Account, { descriptors }: RenderParams = {}) => {
    const { services } = createTestCompositionRoot<{ services: StakingDep }, MockSuiteState>({
        preloadedState: createEarnStakingTableState({ accounts: [account], descriptors }),
        services: () => ({ staking: mockStakingServices() }),
    });

    return renderHookWithProviders(services, () => useTradeBoxEarnOptions(account), {
        queryClient: mockStakingQueryClient(),
    });
};

describe('useTradeBoxEarnOptions', () => {
    it('offers earning on a network with a staking product', () => {
        const { result } = renderEarnOptions(mockAccount({ symbol: ETH, descriptor: '0xa' }));

        expect(result.current.hasEarnOption).toBe(true);
    });

    it('offers nothing on a network without one', () => {
        const { result } = renderEarnOptions(mockAccount({ symbol: BTC, descriptor: 'bc1a' }));

        expect(result.current.hasEarnOption).toBe(false);
        expect(result.current.yieldBadge).toBeNull();
    });

    it('asks the product registry, not the network feature, so an unregistered network offers nothing', () => {
        const { result } = renderEarnOptions(mockAccount({ symbol: ETH, descriptor: '0xa' }), {
            descriptors: [],
        });

        expect(result.current.hasEarnOption).toBe(false);
    });
});
