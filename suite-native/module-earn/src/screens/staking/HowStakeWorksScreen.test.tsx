import { type PropsWithChildren } from 'react';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderWithStoreProvider } from '@suite-native/test-utils-store';
import { mock } from '@trezor/dependency-injection';

import { HowStakeWorksScreen } from './HowStakeWorksScreen';

type RemoveEvent = { data: { action: { type: string } } };
const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
let mockIsInfoOnly = false;
const mockNavigation = {
    addListener: mock<(name: string, listener: (event: RemoveEvent) => void) => () => void>(),
    isFocused: () => true,
    replace: mock<() => void>(),
};

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
    useRoute: () => ({
        params: { symbol: 'eth', accountKey: account.key, isInfoOnly: mockIsInfoOnly },
    }),
    useIsFocused: () => true,
    useFocusEffect: jest.fn(),
}));
jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    Screen: ({ children }: PropsWithChildren) => children,
    ScreenHeader: () => null,
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectDeviceAccountsByNetworkSymbol: () => [account],
    selectIsEarnOnboardingConfirmed: () => false,
    selectApy: () => 1,
    selectEntryPeriodInDaysBySymbol: () => 1,
    selectUnstakingPeriodInDaysBySymbol: () => 1,
}));
jest.mock('@suite-native/earn', () => ({
    ...jest.requireActual('@suite-native/earn'),
    useMessageSystemStaking: () => ({ isStakingDisabled: false }),
}));
jest.mock('../../components/earn/HowEarnWorks/stakePresets', () => ({
    useHowStakeWorksPreset: () => ({ benefitItems: [], timelineSections: [] }),
}));

describe('staking education exit analytics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockNavigation.addListener.mockReturnValue(() => undefined);
    });

    it.each([true, false])(
        'only counts a funnel exit when infoOnly=%s is false',
        async isInfoOnly => {
            mockIsInfoOnly = isInfoOnly;
            const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
            await renderWithStoreProvider(<HowStakeWorksScreen />, { services });
            const listener = mockNavigation.addListener.mock.calls.at(-1)?.[1];
            if (!listener) throw new Error('Missing removal listener');
            await act(() => listener({ data: { action: { type: 'GO_BACK' } } }));

            expect(
                jest.mocked(services.analytics.report).mock.calls.map(([event]) => event),
            ).toEqual(
                isInfoOnly
                    ? []
                    : [
                          {
                              type: 'staking/stake',
                              payload: {
                                  action: 'cancel',
                                  step: 'stake-in-a-nutshell-modal',
                                  networkSymbol: 'eth',
                              },
                          },
                      ],
            );
        },
    );
});
