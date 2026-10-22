import { type PropsWithChildren, type ReactNode } from 'react';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { type ActiveView } from '@suite-native/atoms';
import { deviceAuthorizationInitialState } from '@suite-native/device-authorization';
import { act, fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';
import { mock } from '@trezor/dependency-injection';

import { UnstakeFlowScreen } from './UnstakeFlowScreen';
import { useUnstakeForm } from '../../hooks/staking/useUnstakeForm';

type BeforeRemoveEvent = { data: { action: { type: string } } };
const mockNavigation = {
    addListener: mock<(name: string, listener: (event: BeforeRemoveEvent) => void) => () => void>(),
    isFocused: () => true,
    navigate: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
    useRoute: () => ({ params: { accountKey: 'account-key' } }),
    useFocusEffect: jest.fn(),
}));
jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    Screen: ({ children, footer }: PropsWithChildren<{ footer: ReactNode }>) => (
        <>
            {children}
            {footer}
        </>
    ),
    ScreenHeader: () => null,
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectAccountNetworkSymbol: () => 'eth',
    selectIsEarnOnboardingConfirmed: () => true,
}));
jest.mock('@suite-native/forms', () => ({
    ...jest.requireActual('@suite-native/forms'),
    Form: ({ children }: PropsWithChildren) => children,
}));
jest.mock('@suite-native/transaction-management', () => ({ FeeSelector: () => null }));
jest.mock('../../hooks/staking/useSolanaStakingLimit', () => ({
    useSolanaStakingLimit: () => ({ isLimitExceeded: false }),
}));
jest.mock('../../components/staking/UnstakeFlowScreenHeader', () => ({
    UnstakeFlowScreenHeader: () => null,
}));
jest.mock('../../components/staking/UnstakingTimelineCard', () => ({
    UnstakingTimelineCard: () => null,
}));
jest.mock('../../components/staking/SolanaUnstakeAmountBoundsAlert', () => ({
    SolanaUnstakeAmountBoundsAlert: () => null,
}));
jest.mock('../../hooks/staking/useUnstakeForm');
jest.mock('../../components/earn/EarnAmountCard', () => ({ EarnAmountCard: () => null }));
jest.mock('../../components/earn/EarnOutputFields', () => ({
    EarnOutputFields: ({ onCurrencyChange }: { onCurrencyChange: (view: ActiveView) => void }) => {
        const { Pressable, Text } = jest.requireActual('react-native');

        return (
            <>
                <Pressable onPress={() => onCurrencyChange('secondary')}>
                    <Text>Fiat input</Text>
                </Pressable>
                <Pressable onPress={() => onCurrencyChange('primary')}>
                    <Text>Crypto input</Text>
                </Pressable>
            </>
        );
    },
}));

const renderUnstakeForm = async () => {
    const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics(jest.fn()) };
    const view = await renderWithStoreProvider(<UnstakeFlowScreen />, {
        services,
        preloadedState: {
            deviceAuthorization: deviceAuthorizationInitialState,
            device: { selectedDevice: { connected: true } },
        },
    });

    return {
        ...view,
        analytics: services.analytics,
        goBack: async () => {
            const listener = mockNavigation.addListener.mock.calls.at(-1)?.[1];
            if (!listener) throw new Error('Missing beforeRemove listener');
            await act(() => listener({ data: { action: { type: 'GO_BACK' } } }));
        },
    };
};

describe('UnstakeFlowScreen analytics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockNavigation.addListener.mockReturnValue(jest.fn());
        jest.mocked(useUnstakeForm).mockReturnValue({
            account: mockWalletAccount({ symbol: asNetworkSymbol('eth') }),
            form: {
                formState: { isValid: false },
                handleSubmit: (callback: () => void) => callback,
            },
        } as unknown as NonNullable<ReturnType<typeof useUnstakeForm>>);
    });

    it.each([
        ['crypto', []],
        ['fiat', ['Fiat input']],
        ['crypto', ['Fiat input', 'Crypto input']],
    ] as const)(
        'reports the latest %s currency when the form is cancelled',
        async (currency, inputs) => {
            const view = await renderUnstakeForm();
            for (const input of inputs) await fireEvent.press(view.getByText(input));
            await view.goBack();
            expect(view.analytics.report).toHaveBeenCalledWith({
                type: 'staking/unstake',
                payload: {
                    action: 'cancel',
                    step: 'unstake-form-modal',
                    networkSymbol: 'eth',
                    currency,
                },
            });
        },
    );
});
