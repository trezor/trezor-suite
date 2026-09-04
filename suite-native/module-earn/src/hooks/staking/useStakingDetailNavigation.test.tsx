import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { RootStackRoutes } from '@suite-native/navigation';
import { renderHook } from '@suite-native/test-utils';

import { useStakingDetailNavigation } from './useStakingDetailNavigation';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate }),
}));

const accountKey = 'account-key' as AccountKey;
const solSymbol = asNetworkSymbol('sol');
const ethSymbol = asNetworkSymbol('eth');

describe('useStakingDetailNavigation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('navigates a Solana account to staking management', async () => {
        const { result } = await renderHook(() => useStakingDetailNavigation());
        result.current.navigateToStakingDetail({ accountKey, symbol: solSymbol });

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.StakingManagement, {
            accountKey,
        });
    });

    it('navigates an Ethereum account to staking management', async () => {
        const { result } = await renderHook(() => useStakingDetailNavigation());
        result.current.navigateToStakingDetail({ accountKey, symbol: ethSymbol });

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.StakingManagement, {
            accountKey,
        });
    });
});
