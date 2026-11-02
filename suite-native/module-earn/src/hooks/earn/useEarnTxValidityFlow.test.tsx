import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { useTxValidityTimer } from '@suite-native/transaction-management';

import { useEarnTxValidityFlow } from './useEarnTxValidityFlow';

const mockAccount = mockWalletAccount({
    symbol: asNetworkSymbol('sol'),
});
const mockNavigation = { pop: jest.fn(), isFocused: () => true };
let mockIsSigned = true;

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectAccountByKey: () => mockAccount,
    selectSendPrecomposedTx: () => null,
}));
jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    selectIsTransactionAlreadySigned: () => mockIsSigned,
    useTxValidityTimer: jest.fn(),
}));
jest.mock('./useEarnSelectedPrecomposedTransaction', () => ({
    useEarnSelectedPrecomposedTransaction: () => null,
}));
jest.mock('./useHandleEarnReviewError', () => ({
    useHandleEarnReviewError: () => jest.fn(),
}));
jest.mock('@trezor/connect', () => ({
    __esModule: true,
    ...jest.requireActual('@trezor/connect'),
    default: { cancel: jest.fn() },
}));

describe('expired Earn review cancellation', () => {
    beforeEach(() => jest.clearAllMocks());

    it.each([true, false])(
        'reports an explicit timer cancellation only for a signed review (signed=%s)',
        async isSigned => {
            mockIsSigned = isSigned;
            const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
            await renderHookWithStoreProvider(
                () =>
                    useEarnTxValidityFlow({
                        accountKey: mockAccount.key,
                        stakeType: 'stake',
                        revealConfirmOnTrezorSheet: jest.fn(),
                        isPushing: false,
                    }),
                { services },
            );

            const timer = jest.mocked(useTxValidityTimer).mock.lastCall?.[0];
            if (!timer) throw new Error('Missing validity timer');
            await act(() => timer.onCancel());

            expect(mockNavigation.pop).toHaveBeenCalledTimes(1);
            if (isSigned) {
                expect(services.analytics.report).toHaveBeenCalledTimes(1);
                expect(services.analytics.report).toHaveBeenCalledWith({
                    type: 'transaction/cancel',
                    payload: { txType: 'stake', networkSymbol: 'sol', stage: 'review' },
                });
            } else {
                expect(services.analytics.report).not.toHaveBeenCalled();
            }
        },
    );
});
