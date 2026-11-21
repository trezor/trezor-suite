import '@suite-common/test-utils/globalOverrides';

import { act } from '@testing-library/react';

import { setFlag } from '@suite/flags';
import { type StakingDep } from '@suite-common/earn-staking';
import { mockStakingServices } from '@suite-common/earn-staking/mocks';
import { type StakingProductDescriptor } from '@suite-common/earn-staking-common';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { renderHookWithProviders } from '#src/support/test-utils/hooksHelper';
import {
    THOD,
    adaAccount,
    adaExternalProduct,
    adaFiveBinariesProduct,
    amount,
    createStakingDashboardState,
    ethAccount,
    ethProduct,
    mockPosition,
    products,
    solAccount,
} from '#src/views/wallet/staking/components/stakingDashboardTestState';

import { useEarnEthBanner } from './useEarnEthBanner';
import { type StakingBannerAccounts, useStakingBanner } from './useStakingBanner';
import { type MockSuiteState } from '../../../../mocks/mockInitialAppState';

// The yield half of the banner has its own query; here only the staking promo is under test.
jest.mock('./useEarnEthBanner', () => ({ useEarnEthBanner: jest.fn() }));

type RenderParams = {
    accounts: StakingBannerAccounts;
    descriptors?: readonly StakingProductDescriptor[];
    isStaked?: boolean;
    isClosed?: boolean;
};

const renderBanner = ({
    accounts,
    descriptors = products,
    isStaked = false,
    isClosed = false,
}: RenderParams) => {
    const [account] = accounts;
    const state: MockSuiteState = createStakingDashboardState({
        accounts: [...accounts],
        descriptors,
        positions: isStaked
            ? {
                  [account.key]: [
                      mockPosition(ethProduct.id, {
                          balances: {
                              staked: amount('1000000000000000000'),
                              pending: amount('0'),
                              unstaking: amount('0'),
                              withdrawable: amount('0'),
                              rewards: amount('0'),
                          },
                          operations: ['stake', 'unstake'],
                      }),
                  ],
              }
            : {},
    });
    const { services } = createTestCompositionRoot<{ services: StakingDep }, MockSuiteState>({
        preloadedState: {
            ...state,
            flags: { ...state.flags, stakeEthBannerClosed: isClosed },
        },
        services: () => ({ staking: mockStakingServices() }),
    });
    const dispatch = jest.spyOn(services.store, 'dispatch');

    const view = renderHookWithProviders(services, () => useStakingBanner(accounts));

    return { ...view, dispatch };
};

describe('useStakingBanner', () => {
    beforeEach(() => {
        jest.mocked(useEarnEthBanner).mockReturnValue({
            isResolving: false,
            hasYieldOption: false,
            apy: null,
        });
    });

    it('offers the staking promo to an account that does not stake yet', () => {
        const { result } = renderBanner({ accounts: [ethAccount] });

        expect(result.current.kind).toBe('staking');
    });

    it('offers it on Hoodi, which stakes on a product of its own', () => {
        const hoodiAccount: Account = mockWalletAccount({
            symbol: THOD,
            availableBalance: '3000000000000000000',
        });

        const { result } = renderBanner({ accounts: [hoodiAccount] });

        expect(result.current.kind).toBe('staking');
    });

    it('withholds it from an account that already stakes', () => {
        const { result } = renderBanner({ accounts: [ethAccount], isStaked: true });

        expect(result.current.kind).toBeUndefined();
    });

    it('withholds it once the banner was closed', () => {
        const { result } = renderBanner({ accounts: [ethAccount], isClosed: true });

        expect(result.current.kind).toBeUndefined();
    });

    it('withholds it from a network without a product to stake into', () => {
        const { result } = renderBanner({
            accounts: [adaAccount],
            descriptors: [adaFiveBinariesProduct, adaExternalProduct],
        });

        expect(result.current.kind).toBeUndefined();
    });

    it('withholds it from a network whose product is not registered', () => {
        const { result } = renderBanner({ accounts: [solAccount], descriptors: [ethProduct] });

        expect(result.current.kind).toBeUndefined();
    });

    it('closes the promo through the flag of its network', () => {
        const { result, dispatch } = renderBanner({ accounts: [ethAccount] });

        act(() => {
            result.current.close();
        });

        expect(dispatch).toHaveBeenCalledWith(
            setFlag({ key: 'stakeEthBannerClosed', value: true }),
        );
    });
});
