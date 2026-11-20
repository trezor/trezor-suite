import { deviceInitialState } from '@suite-common/device';
import { Feature } from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { type AccountKey } from '@suite-common/wallet-types';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useEarnNoBalanceActions } from './useEarnNoBalanceActions';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ popTo: jest.fn(), navigate: jest.fn() }),
}));

const accountKey = 'eth-account-key' as AccountKey;

const renderNoBalanceActions = (isRegionRestricted: boolean) =>
    renderHookWithStoreProvider(() => useEarnNoBalanceActions({ accountKey }), {
        preloadedState: {
            device: deviceInitialState,
            messageSystem: mockMessageSystemStateWithFeatureFlags(
                { [Feature.regions.presenceRestriction]: isRegionRestricted },
                { [Feature.regions.presenceRestriction]: { countries: ['US'] } },
            ),
            wallet: { trading: { residence: { wasOnboardingVisited: false } } },
        },
    });

describe(useEarnNoBalanceActions.name, () => {
    it('offers no buy or swap action when the region is restricted', async () => {
        const { result } = await renderNoBalanceActions(true);

        expect(result.current.handleBuyPress).toBeUndefined();
        expect(result.current.handleSwapPress).toBeUndefined();
        expect(result.current.handleReceivePress).toBeDefined();
    });

    it('offers buy and swap actions when the region is not restricted', async () => {
        const { result } = await renderNoBalanceActions(false);

        expect(result.current.handleBuyPress).toBeDefined();
        expect(result.current.handleSwapPress).toBeDefined();
    });
});
