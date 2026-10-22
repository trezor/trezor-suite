import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { getStakingDashboardAnalytics } from './useStakingTableData';

const ada = asNetworkSymbol('ada');
const eth = asNetworkSymbol('eth');

describe('staking dashboard analytics', () => {
    it('counts supported opportunities without requiring an existing account', () => {
        expect(
            getStakingDashboardAnalytics({
                stakingAccounts: [],
                deviceSupportedNetworkSymbols: [
                    eth,
                    ada,
                    asNetworkSymbol('sol'),
                    asNetworkSymbol('trx'),
                ],
            }),
        ).toEqual({ hasStakingPosition: false, availableStakingCount: 4 });
    });

    it('counts each offered network once across all accounts, including hidden positions', () => {
        const emptyAccount = mockWalletAccount({ symbol: ada, balance: '0' });
        const activeAccount = mockWalletAccount({ symbol: ada, index: 9, balance: '1000000' });

        expect(
            getStakingDashboardAnalytics({
                stakingAccounts: [emptyAccount, activeAccount],
                deviceSupportedNetworkSymbols: [ada],
            }),
        ).toEqual({ hasStakingPosition: true, availableStakingCount: 1 });
    });

    it('includes visible existing accounts even when the device cannot activate their network', () => {
        expect(
            getStakingDashboardAnalytics({
                stakingAccounts: [mockWalletAccount({ symbol: eth, formattedBalance: '1' })],
                deviceSupportedNetworkSymbols: [],
            }),
        ).toEqual({ hasStakingPosition: false, availableStakingCount: 1 });
    });

    it('does not treat a funded but undelegated account as an active staking position', () => {
        expect(
            getStakingDashboardAnalytics({
                stakingAccounts: [
                    mockWalletAccount(
                        { symbol: ada, balance: '1000000' },
                        { misc: { staking: { isActive: false } } },
                    ),
                ],
                deviceSupportedNetworkSymbols: [ada],
            }),
        ).toEqual({ hasStakingPosition: false, availableStakingCount: 1 });
    });
});
