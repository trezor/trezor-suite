import { mockResolvedYieldFlowData } from '@suite-common/wallet-core/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { renderWithStoreProvider, waitFor } from '@suite-native/test-utils-store';

import { StartYieldDepositScreen } from './StartYieldDepositScreen';
import { useStartYieldDepositFlow } from '../../hooks/yield/useStartYieldDepositFlow';

const mockStartDeposit = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ params: {} }),
}));
jest.mock('../../hooks/yield/useStartYieldDepositFlow');
jest.mock('../../components/earn/EarnLoadingScreen', () => ({ EarnLoadingScreen: () => null }));

describe('StartYieldDepositScreen analytics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(useStartYieldDepositFlow).mockReturnValue({
            handleStartYieldDepositFlow: mockStartDeposit,
            isStartingDepositFlow: false,
        });
    });

    it.each(['deposit-form', 'insufficient-balance-screen'] as const)(
        'completes the skipped onboarding navigation to %s once',
        async destination => {
            mockStartDeposit.mockResolvedValue(destination);
            const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
            const data = mockResolvedYieldFlowData();
            const view = await renderWithStoreProvider(
                <StartYieldDepositScreen yieldFlowData={data} />,
                { services },
            );

            await waitFor(() =>
                expect(services.analytics.report).toHaveBeenCalledWith({
                    type: 'yield/navigate',
                    payload: {
                        action: 'continue',
                        from: 'deposit-in-a-nutshell-modal',
                        to: destination,
                        networkSymbol: data.account.symbol,
                        vaultId: data.vault.id,
                    },
                }),
            );
            await view.rerender(<StartYieldDepositScreen yieldFlowData={{ ...data }} />);
            expect(mockStartDeposit).toHaveBeenCalledTimes(1);
            expect(services.analytics.report).toHaveBeenCalledTimes(1);
        },
    );

    it('does not report a destination when the flow did not start', async () => {
        mockStartDeposit.mockResolvedValue(null);
        const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
        await renderWithStoreProvider(
            <StartYieldDepositScreen yieldFlowData={mockResolvedYieldFlowData()} />,
            { services },
        );

        expect(mockStartDeposit).toHaveBeenCalledTimes(1);
        expect(services.analytics.report).not.toHaveBeenCalled();
    });
});
