import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type YieldClaimAccountItem } from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { type BottomSheetModalProps } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import { fireEvent } from '@suite-native/test-utils';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { mock } from '@trezor/dependency-injection';

import { YieldClaimRewardsSummaryCard } from './YieldClaimRewardsSummaryCard';

const mockNavigate = mock<(...args: unknown[]) => void>();
const mockOpen = mock<() => void>();
const mockClose = mock<() => void>();
let mockFirmwareSupported = true;
const mockItems: YieldClaimAccountItem[] = [
    {
        summary: {
            accountKey: mockWalletAccount({ symbol: asNetworkSymbol('eth') }).key,
            networkSymbol: asNetworkSymbol('eth'),
            claimableRewardsCount: 1,
            fiatClaimableAmount: null,
            tokens: [],
        },
        vaults: [],
    },
];
const mockEmptyItems: never[] = [];
const mockSummaries = mockItems.map(item => item.summary);

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate }),
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectYieldListItems: () => mockEmptyItems,
    selectYieldClaimListItems: () => mockSummaries,
    selectYieldClaimTokens: () => mockEmptyItems,
    selectYieldClaimAccountItems: () => mockItems,
    selectYieldClaimTotalFiatAmount: () => null,
    selectAccountByKey: () => undefined,
    useYieldClaimRewardsWithFiat: () => ({
        claimRewardsWithFiat: mockEmptyItems,
        isClaimLoading: false,
    }),
    useYieldOpportunities: () => ({ yieldOpportunities: mockEmptyItems }),
}));
jest.mock('@suite-native/earn', () => ({
    ...jest.requireActual('@suite-native/earn'),
    useMessageSystemYield: () => ({ isDisabled: false }),
}));
jest.mock('@suite-native/icons', () => ({
    ...jest.requireActual('@suite-native/icons'),
    TokenIcon: () => null,
}));
jest.mock('@suite-native/formatters', () => ({
    ...jest.requireActual('@suite-native/formatters'),
    BaseCurrencyAmountFormatter: () => null,
}));
jest.mock('../../hooks/yield/useStablecoinYieldFirmwareUpdateAlert', () => ({
    useStablecoinYieldFirmwareUpdateAlert: () => ({
        isFirmwareSupported: () => mockFirmwareSupported,
        showFirmwareUpdateAlert: jest.fn(),
    }),
}));
jest.mock('@suite-native/atoms', () => ({
    ...jest.requireActual('@suite-native/atoms'),
    useBottomSheetModal: () => ({
        bottomSheetRef: { current: null },
        openModal: mockOpen,
        closeModal: mockClose,
    }),
    BottomSheetModal: ({ children, onDismiss }: BottomSheetModalProps) => {
        const { View } = jest.requireActual('react-native');

        return (
            <View testID="claim-sheet" onDismiss={onDismiss}>
                {children}
            </View>
        );
    },
}));

const openSelection = async () => {
    const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
    const view = await renderWithStoreProvider(<YieldClaimRewardsSummaryCard />, { services });
    await fireEvent.press(
        view.getByText(getTranslation('earn.earnScreen.depositsCard.claimRewardsButton')),
    );

    return { ...view, analytics: services.analytics };
};

describe('Claim account selection analytics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockFirmwareSupported = true;
    });

    it('reports opening and one cancellation per visit using the desktop funnel steps', async () => {
        const view = await openSelection();
        await fireEvent(view.getByTestId('claim-sheet'), 'dismiss');
        await fireEvent(view.getByTestId('claim-sheet'), 'dismiss');

        expect(jest.mocked(view.analytics.report).mock.calls.map(([event]) => event)).toEqual([
            { type: 'yield/interaction', payload: { element: 'earn-dashboard-claim-rewards' } },
            {
                type: 'yield/navigate',
                payload: {
                    action: 'continue',
                    from: 'earn-dashboard',
                    to: 'claim-select-account-modal',
                },
            },
            {
                type: 'yield/navigate',
                payload: {
                    action: 'cancel',
                    from: 'claim-select-account-modal',
                    to: 'claim-select-account-modal',
                },
            },
        ]);
    });

    it('reports selection from the account modal without a cancellation or account identifiers', async () => {
        const view = await openSelection();
        await fireEvent.press(view.getByText('Ethereum'));
        await fireEvent(view.getByTestId('claim-sheet'), 'dismiss');

        expect(jest.mocked(view.analytics.report).mock.calls.map(([event]) => event)).toEqual([
            { type: 'yield/interaction', payload: { element: 'earn-dashboard-claim-rewards' } },
            {
                type: 'yield/navigate',
                payload: {
                    action: 'continue',
                    from: 'earn-dashboard',
                    to: 'claim-select-account-modal',
                },
            },
            {
                type: 'yield/navigate',
                payload: {
                    action: 'continue',
                    from: 'claim-select-account-modal',
                    to: 'claim-form',
                    networkSymbol: 'eth',
                },
            },
        ]);
        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('does not report opening the selection when firmware blocks it', async () => {
        mockFirmwareSupported = false;
        const view = await openSelection();
        await fireEvent(view.getByTestId('claim-sheet'), 'dismiss');

        expect(mockOpen).not.toHaveBeenCalled();
        expect(view.analytics.report).toHaveBeenCalledTimes(1);
    });
});
