import { act } from '@testing-library/react';

import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { type Account } from '@suite-common/wallet-types';

import { useStakingTableData } from './useStakingTableData';
import { type MockSuiteState } from '../../../../../../mocks/mockInitialAppState';
import {
    ADA,
    ETH,
    SOL,
    TRX,
    createEarnStakingTableState,
    ethProduct,
    mockAccount,
    mockStakedPosition,
} from '../earnStakingTableTestState';

const ONE_ETH = '1000000000000000000';
const HUNDREDTH_ETH = '10000000000000000';

type RenderParams = Parameters<typeof createEarnStakingTableState>[0];

const renderTableData = (params: RenderParams) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: createEarnStakingTableState(params),
    });

    return renderHookWithStoreProvider(() => useStakingTableData(), { services });
};

const eth = (descriptor: string, overrides: Partial<Parameters<typeof mockAccount>[0]> = {}) =>
    mockAccount({ symbol: ETH, descriptor, ...overrides });
const sol = (descriptor: string, overrides: Partial<Parameters<typeof mockAccount>[0]> = {}) =>
    mockAccount({ symbol: SOL, descriptor, ...overrides });
const ada = (descriptor: string, overrides: Partial<Parameters<typeof mockAccount>[0]> = {}) =>
    mockAccount({ symbol: ADA, descriptor, ...overrides });

const keysOf = (accounts: Account[]) => accounts.map(({ key }) => key);

describe('useStakingTableData', () => {
    describe('hasAnyRewardsData', () => {
        it('is false without a staking account', () => {
            const { result } = renderTableData({ accounts: [] });

            expect(result.current.hasAnyRewardsData).toBe(false);
            expect(result.current.hasStakingPosition).toBe(false);
        });

        it('is false while every account is below the dashboard minimum', () => {
            const { result } = renderTableData({
                accounts: [
                    eth('0xa', { availableBalance: HUNDREDTH_ETH }),
                    sol('sola', { availableBalance: '1000' }),
                ],
            });

            expect(result.current.hasAnyRewardsData).toBe(false);
        });

        it('is true once an account can stake', () => {
            const { result } = renderTableData({
                accounts: [
                    eth('0xa', { availableBalance: HUNDREDTH_ETH }),
                    eth('0xb', { availableBalance: ONE_ETH }),
                ],
            });

            expect(result.current.hasAnyRewardsData).toBe(true);
        });

        it('is true once an account stakes', () => {
            const staked = eth('0xa');
            const { result } = renderTableData({
                accounts: [staked],
                positions: { [staked.key]: [mockStakedPosition(ethProduct.id, ONE_ETH)] },
            });

            expect(result.current.hasAnyRewardsData).toBe(true);
            expect(result.current.hasStakingPosition).toBe(true);
        });
    });

    describe('the collapsed table', () => {
        it('shows one underfunded account per network, the lowest index first', () => {
            const { result } = renderTableData({
                accounts: [
                    eth('0xc', { index: 2 }),
                    eth('0xb', { index: 1 }),
                    eth('0xa', { index: 0 }),
                    sol('sold', { index: 3 }),
                    sol('sola', { index: 0 }),
                ],
            });

            expect(keysOf(result.current.displayedAccounts)).toEqual([
                eth('0xa', { index: 0 }).key,
                sol('sola', { index: 0 }).key,
            ]);
            expect(result.current.isExpandable).toBe(true);
        });

        it('prefers a normal account to a legacy or ledger one at any index', () => {
            const { result } = renderTableData({
                accounts: [
                    ada('adaledger', { index: 0, accountType: 'ledger' }),
                    ada('adalegacy', { index: 0, accountType: 'legacy' }),
                    ada('adanormal', { index: 5, accountType: 'normal' }),
                ],
            });

            expect(keysOf(result.current.displayedAccounts)).toEqual([
                ada('adanormal', { index: 5 }).key,
            ]);
        });

        it('keeps no underfunded row for a network that already has a row', () => {
            const staked = eth('0xstaked');
            const { result } = renderTableData({
                accounts: [staked, eth('0xunderfunded', { index: 1 })],
                positions: { [staked.key]: [mockStakedPosition(ethProduct.id, ONE_ETH)] },
            });

            expect(keysOf(result.current.displayedAccounts)).toEqual([staked.key]);
            expect(result.current.isExpandable).toBe(true);
        });

        it('expands to every underfunded account, grouped by network and sorted by index', () => {
            const { result } = renderTableData({
                accounts: [
                    eth('0xi', { index: 8 }),
                    eth('0xh', { index: 7 }),
                    sol('solb', { index: 1 }),
                    eth('0xj', { index: 9 }),
                    ada('adaa', { index: 0 }),
                ],
            });

            act(() => {
                result.current.toggleExpanded();
            });

            expect(keysOf(result.current.displayedAccounts)).toEqual([
                eth('0xh', { index: 7 }).key,
                eth('0xi', { index: 8 }).key,
                eth('0xj', { index: 9 }).key,
                sol('solb', { index: 1 }).key,
                ada('adaa', { index: 0 }).key,
            ]);
            expect(result.current.isExpanded).toBe(true);
        });
    });

    describe('the activate rows and the analytics', () => {
        it('offers the supported networks without an account and counts the available ones', () => {
            const { result } = renderTableData({
                accounts: [eth('0xa', { availableBalance: ONE_ETH })],
            });

            expect(result.current.activateSymbols).toEqual([SOL, ADA, TRX]);
            expect(result.current.availableStakingCount).toBe(4);
        });
    });
});
