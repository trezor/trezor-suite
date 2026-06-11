import { type AccountKey } from '@suite-common/wallet-types';
import { RootStackRoutes } from '@suite-native/navigation';
import { renderHook } from '@suite-native/test-utils';

import { useSolanaStakingFlag } from '../useSolanaStakingFlag';
import { useStakingDetailNavigation } from '../useStakingDetailNavigation';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../useSolanaStakingFlag', () => ({
    useSolanaStakingFlag: jest.fn(),
}));

const mockUseSolanaStakingFlag = jest.mocked(useSolanaStakingFlag);

const accountKey = 'account-key' as AccountKey;

describe('useStakingDetailNavigation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('navigates a Solana account to staking management when the feature flag is enabled', () => {
        mockUseSolanaStakingFlag.mockReturnValue(true);

        const { result } = renderHook(() => useStakingDetailNavigation());
        result.current.navigateToStakingDetail({ accountKey, symbol: 'sol' });

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.StakingManagement, {
            accountKey,
        });
    });

    it('falls back to the read-only staking detail page when the Solana flag is disabled', () => {
        mockUseSolanaStakingFlag.mockReturnValue(false);

        const { result } = renderHook(() => useStakingDetailNavigation());
        result.current.navigateToStakingDetail({ accountKey, symbol: 'sol' });

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.StakingDetail, {
            accountKey,
        });
    });

    it('never gates Ethereum staking regardless of the Solana flag', () => {
        mockUseSolanaStakingFlag.mockReturnValue(false);

        const { result } = renderHook(() => useStakingDetailNavigation());
        result.current.navigateToStakingDetail({ accountKey, symbol: 'eth' });

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.StakingManagement, {
            accountKey,
        });
    });
});
