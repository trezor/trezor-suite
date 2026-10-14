import { combineReducers } from '@reduxjs/toolkit';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import {
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';

import { useMessageSystemWrappedNative } from './useMessageSystemWrappedNative';
import { useStandaloneWrappedNativeController } from './useStandaloneWrappedNativeController';
import { useStandaloneWrappedNativeFlow } from './useStandaloneWrappedNativeFlow';
import { useWrappedNativeTokenFees } from './useWrappedNativeTokenFees';
import { useWrappedNativeTokenForm } from './useWrappedNativeTokenForm';
import { useYieldDepositGasReserve } from '../yield/useYieldDepositGasReserve';

const GAS_RESERVE = { minimum: '0.002', recommended: '0.005' };
const account = mockWalletAccount({ symbol: asNetworkSymbol('eth'), formattedBalance: '0.2' });
let mockRouteParams: { accountKey: string; pendingTransaction?: { amount: string } };

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ params: mockRouteParams }),
}));
jest.mock('./useMessageSystemWrappedNative');
jest.mock('./useStandaloneWrappedNativeFlow');
jest.mock('./useWrappedNativeTokenFees');
jest.mock('./useWrappedNativeTokenForm');
jest.mock('./useNavigateBackAnalytics', () => ({
    useNavigateBackAnalytics: jest.fn(),
}));
jest.mock('../yield/useYieldDepositGasReserve');

const useMessageSystemWrappedNativeMock = jest.mocked(useMessageSystemWrappedNative);
const useYieldDepositGasReserveMock = jest.mocked(useYieldDepositGasReserve);
const useStandaloneWrappedNativeFlowMock = jest.mocked(useStandaloneWrappedNativeFlow);
const useWrappedNativeTokenFeesMock = jest.mocked(useWrappedNativeTokenFees);
const useWrappedNativeTokenFormMock = jest.mocked(useWrappedNativeTokenForm);

const renderStandaloneController = (flowType: 'wrap' | 'unwrap', currentAccount = account) => {
    const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics(jest.fn()) };
    const store = createLightStore({
        reducer: {
            locale: createStaticReducer({
                appLocaleCode: 'en-US',
                systemLocaleCode: 'en-US',
                isSystemLocaleUsed: true,
            }),
            wallet: combineReducers({
                accounts: createStaticReducer([currentAccount]),
                settings: createStaticReducer({ localCurrency: 'usd', bitcoinAmountUnit: 0 }),
            }),
        },
    });

    return renderHookWithStoreProvider(() => useStandaloneWrappedNativeController(flowType), {
        services: { ...services, store },
    });
};

describe('useStandaloneWrappedNativeController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRouteParams = { accountKey: account.key };
        useYieldDepositGasReserveMock.mockReturnValue(GAS_RESERVE);
        useMessageSystemWrappedNativeMock.mockReturnValue({
            isDisabled: false,
            content: undefined,
            variant: undefined,
        } as ReturnType<typeof useMessageSystemWrappedNative>);
        useWrappedNativeTokenFormMock.mockReturnValue({
            amountValue: '1',
            form: { formState: { isValid: true } },
        } as unknown as ReturnType<typeof useWrappedNativeTokenForm>);
        useWrappedNativeTokenFeesMock.mockReturnValue({
            isFeeReady: true,
            preparedAction: null,
        } as unknown as ReturnType<typeof useWrappedNativeTokenFees>);
        useStandaloneWrappedNativeFlowMock.mockReturnValue({
            handleSubmit: jest.fn(),
            handleCancelSimulation: jest.fn(),
            handleConfirmSimulation: jest.fn(),
            hasFlowFailed: false,
            isDeviceNotConnectedVisible: false,
            isFirmwareOutdatedVisible: false,
            pendingBottomSheetRef: { current: null },
            pendingModalProps: null,
            preparedTx: null,
            reportMaxSelected: jest.fn(),
            simulationBottomSheetRef: { current: null },
        } as unknown as ReturnType<typeof useStandaloneWrappedNativeFlow>);
    });

    it('spends the native coin without a token contract on wrap', async () => {
        const { result } = await renderStandaloneController('wrap');

        if (result.current.status !== 'ready') throw new Error('not ready');
        expect(result.current.spentTokenContract).toBeUndefined();
        expect(result.current.amountInput.balance).toBe('0.2');
        expect(result.current.amountInput.maxAmount).toBe('0.195');
        expect(result.current.amountInput.isDisabled).toBe(false);
        expect(result.current.feeReserve).toEqual({
            amount: '0.005',
            isInsufficient: false,
            wrapStatus: 'none',
        });
        expect(result.current.submit.isDisabled).toBe(false);
    });

    it('does not freeze the standalone wrap reserve into a session', async () => {
        await renderStandaloneController('wrap');

        expect(useYieldDepositGasReserveMock).toHaveBeenCalledWith({
            account,
            isWrappedNativeVault: true,
            tokenContractAddress: expect.any(String),
            isDisabled: false,
        });
    });

    it('blocks the wrap while the balance does not exceed the recommended reserve', async () => {
        const { result } = await renderStandaloneController(
            'wrap',
            mockWalletAccount({ symbol: asNetworkSymbol('eth'), formattedBalance: '0.004' }),
        );

        if (result.current.status !== 'ready') throw new Error('not ready');
        expect(result.current.amountInput.maxAmount).toBe('0');
        expect(result.current.amountInput.isDisabled).toBe(true);
        expect(result.current.feeReserve?.isInsufficient).toBe(true);
        expect(result.current.submit.isDisabled).toBe(true);
    });

    it('spends the wrapped token with its contract on unwrap', async () => {
        const { result } = await renderStandaloneController('unwrap');

        if (result.current.status !== 'ready') throw new Error('not ready');
        expect(result.current.spentTokenContract).toBe(result.current.wrappedTokenContract);
        expect(result.current.amountInput.maxAmount).toBeUndefined();
        expect(result.current.amountInput.isDisabled).toBe(false);
        expect(result.current.feeReserve).toBeNull();
        expect(useYieldDepositGasReserveMock).toHaveBeenCalledWith(
            expect.objectContaining({ isDisabled: true }),
        );
    });

    it('blocks the submit when the flow is disabled by the message system', async () => {
        useMessageSystemWrappedNativeMock.mockReturnValue({
            isDisabled: true,
            content: 'off',
            variant: 'warning',
        } as unknown as ReturnType<typeof useMessageSystemWrappedNative>);

        const { result } = await renderStandaloneController('wrap');

        if (result.current.status !== 'ready') throw new Error('not ready');
        expect(result.current.submit.isDisabled).toBe(true);
        expect(result.current.disabledAlert).toEqual({ content: 'off', variant: 'warning' });
    });
});
