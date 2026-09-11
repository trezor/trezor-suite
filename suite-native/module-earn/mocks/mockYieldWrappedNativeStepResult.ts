import { mockYieldSessionState } from '@suite-common/wallet-core/mocks';

import { type useYieldWrappedNativeStep } from '../src/hooks/yield/useYieldWrappedNativeStep';

type YieldWrappedNativeStepResult = ReturnType<typeof useYieldWrappedNativeStep>;

export const mockYieldWrappedNativeStepResult = (
    overrides: Partial<YieldWrappedNativeStepResult> = {},
): YieldWrappedNativeStepResult => ({
    amountValue: '1',
    displayedPendingTransaction: { type: 'wrap', txid: '0xretained', amount: '1' },
    // Omit thunk and react-hook-form internals from these mocks.
    fees: {
        isFeeReady: true,
        isFeePreparing: false,
    } as YieldWrappedNativeStepResult['fees'],
    form: { form: {} } as YieldWrappedNativeStepResult['form'],
    handleClose: jest.fn(),
    handleSkip: jest.fn(),
    isAmountReady: true,
    isFeeSectionDisplayed: true,
    isSheetPresented: false,
    isStepPending: true,
    isStepSessionReady: true,
    pendingBottomSheetRef: { current: null },
    pendingModalProps: {
        fee: undefined,
        isExploreDisabled: false,
        onDismiss: jest.fn(),
        onExplorePress: jest.fn(),
        submittedAt: new Date(0),
        txid: '0xretained',
    },
    pendingTransaction: { type: 'wrap', txid: '0xlive', amount: '1' },
    session: mockYieldSessionState({ step: 'wrap' }),
    simulation: {
        handleSubmit: jest.fn(),
        handleCancelSimulation: jest.fn(),
        handleConfirmSimulation: jest.fn(),
        isDeviceNotConnectedVisible: false,
        isFirmwareOutdatedVisible: false,
        preparedTx: null,
        simulationBottomSheetRef: { current: null },
    } as YieldWrappedNativeStepResult['simulation'],
    ...overrides,
});
