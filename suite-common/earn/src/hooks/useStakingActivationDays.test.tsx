/**
 * @jest-environment jsdom
 */
import { type StakingDep, type StakingRootState } from '@suite-common/earn-staking';
import { mockStakingServices, mockStakingState } from '@suite-common/earn-staking/mocks';
import { type EthValidatorsQueue } from '@suite-common/earn-staking-api';
import {
    type StakingPositionActivation,
    type StakingProductDescriptor,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { useStakingActivationDays } from './useStakingActivationDays';

type HookDeps = { services: StakingDep };
type HookState = StakingRootState & AccountsRootState;

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_S = 24 * 60 * 60;
const NOW_MS = 1_700_000_000_000;

const mockUseEthereumValidatorsQueue = jest.fn<
    { data: EthValidatorsQueue | undefined },
    [{ account: unknown; timestamp?: number }, { enabled: boolean }]
>();

jest.mock('@suite-common/earn-staking-api', () => ({
    ...jest.requireActual('@suite-common/earn-staking-api'),
    useEthereumValidatorsQueue: (...args: Parameters<typeof mockUseEthereumValidatorsQueue>) =>
        mockUseEthereumValidatorsQueue(...args),
}));

const eth = mockStakingProductDescriptor();
const sol = mockStakingProductDescriptor({ networkSymbol: asNetworkSymbol('sol'), type: 'native' });
const ethAccount = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const solAccount = mockWalletAccount({ symbol: asNetworkSymbol('sol') });
const pending = stakingAmountSchema.parse('750000000000000000');

// Mined two days ago; today's queue would activate it tomorrow.
const minedStake: StakingPositionActivation = {
    amount: pending,
    startedAt: NOW_MS - 2 * DAY_MS,
    availableAt: NOW_MS + DAY_MS,
};

const renderActivationDays = (
    account: Account,
    descriptor: StakingProductDescriptor,
    activation: StakingPositionActivation,
) => {
    const { services } = createTestCompositionRoot<HookDeps, HookState>({
        reducer: {
            earn: (state: HookState['earn'] = { staking: mockStakingState() }) => state,
            wallet: (state: HookState['wallet'] = { accounts: [] }) => state,
        },
        preloadedState: {
            earn: {
                staking: mockStakingState({
                    descriptors: [descriptor],
                    positions: {
                        [account.key]: [
                            mockStakingPosition({
                                productId: descriptor.id,
                                status: 'activating',
                                activations: [activation],
                            }),
                        ],
                    },
                }),
            },
            wallet: { accounts: [account] },
        },
        services: () => ({ staking: mockStakingServices() }),
    });

    return renderHookWithStoreProvider(() => useStakingActivationDays(account.key), { services });
};

describe('useStakingActivationDays', () => {
    beforeEach(() => {
        jest.useFakeTimers({ now: NOW_MS });
        mockUseEthereumValidatorsQueue.mockReset();
        mockUseEthereumValidatorsQueue.mockReturnValue({ data: undefined });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('dates an Ethereum activation from the queue at the time the stake mined', () => {
        mockUseEthereumValidatorsQueue.mockReturnValue({
            data: { addingDelay: DAY_S, activationTime: 9 * DAY_S },
        });

        const { result } = renderActivationDays(ethAccount, eth, minedStake);

        expect(result.current).toBe(8);
        expect(mockUseEthereumValidatorsQueue).toHaveBeenCalledWith(
            { account: ethAccount, timestamp: (NOW_MS - 2 * DAY_MS) / 1000 },
            { enabled: true },
        );
    });

    it('dates the activation from the position while the queue at that time is unknown', () => {
        const { result } = renderActivationDays(ethAccount, eth, minedStake);

        expect(result.current).toBe(1);
    });

    it('does not ask the queue for a network without one', () => {
        const { result } = renderActivationDays(solAccount, sol, {
            amount: pending,
            startedAt: null,
            availableAt: null,
        });

        expect(result.current).toBeNull();
        expect(mockUseEthereumValidatorsQueue).toHaveBeenCalledWith(
            { account: solAccount, timestamp: undefined },
            { enabled: false },
        );
    });
});
