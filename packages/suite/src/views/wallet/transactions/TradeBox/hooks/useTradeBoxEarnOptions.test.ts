import { renderHook } from '@testing-library/react';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useTradeBoxEarnOptions } from './useTradeBoxEarnOptions';

const mockUseNativeYieldVault = jest.fn();
const mockUseStakingRate = jest.fn();

jest.mock('@suite-common/earn-stablecoin', () => ({
    useNativeYieldVault: () => mockUseNativeYieldVault(),
}));

jest.mock('src/hooks/earn/useStakingRate', () => ({
    useStakingRate: () => mockUseStakingRate(),
}));

const account = mockWalletAccount({ symbol: asNetworkSymbol('ada') });

const renderTradeBoxEarnOptions = ({
    vaultApy,
    stakingRate,
}: {
    vaultApy?: number;
    stakingRate: number | null;
}) => {
    mockUseNativeYieldVault.mockReturnValue({
        hasYieldOption: vaultApy !== undefined,
        bestVault: vaultApy !== undefined ? { id: 'vault-1', apy: vaultApy } : undefined,
    });
    mockUseStakingRate.mockReturnValue({ rate: stakingRate });

    return renderHook(() => useTradeBoxEarnOptions(account)).result.current;
};

describe('useTradeBoxEarnOptions', () => {
    it('shows no badge when the staking rate is zero', () => {
        expect(renderTradeBoxEarnOptions({ stakingRate: 0 }).yieldBadge).toBeNull();
    });

    it('shows no badge without any rate', () => {
        expect(renderTradeBoxEarnOptions({ stakingRate: null }).yieldBadge).toBeNull();
    });

    it('shows the staking rate for an account without a vault', () => {
        expect(renderTradeBoxEarnOptions({ stakingRate: 2.4 }).yieldBadge).toEqual({
            apy: 2.4,
            vaultId: undefined,
        });
    });

    it('shows the better of the vault and staking rates', () => {
        expect(renderTradeBoxEarnOptions({ vaultApy: 3.1, stakingRate: 2.4 }).yieldBadge).toEqual({
            apy: 3.1,
            vaultId: 'vault-1',
        });
    });
});
