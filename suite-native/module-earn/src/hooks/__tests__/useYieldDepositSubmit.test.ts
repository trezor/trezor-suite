import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useShowYieldAlert } from '../useShowYieldAlert';
import { type PreparedYieldDepositAction } from '../useYieldDepositFees';
import { useYieldDepositSubmit } from '../useYieldDepositSubmit';

jest.mock('../useShowYieldAlert');

const mockUseShowYieldAlert = jest.mocked(useShowYieldAlert);

const preparedAction: PreparedYieldDepositAction = {
    amount: '1',
    feePreview: {
        type: 'final',
        fee: '21000',
        feePerByte: '1',
        feeLimit: '21000',
        totalSpent: '21000',
        bytes: 0,
        inputs: [],
        outputs: [],
        outputsPermutation: [],
    },
    receiptAmount: '0.99',
    unsignedTransaction: '{"gasPrice":"0x1"}',
};

describe('useYieldDepositSubmit', () => {
    const showYieldAlert = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseShowYieldAlert.mockReturnValue(showYieldAlert);
    });

    it('continues with the current prepared action', () => {
        const onActionReady = jest.fn();
        const { result } = renderHookWithBasicProvider(() =>
            useYieldDepositSubmit({
                amount: '1',
                onActionReady,
                preparedAction,
            }),
        );

        act(() => result.current.handleSubmitDeposit());

        expect(onActionReady).toHaveBeenCalledWith(preparedAction);
        expect(showYieldAlert).not.toHaveBeenCalled();
    });

    it.each([
        ['missing', null],
        ['stale', { ...preparedAction, amount: '2' }],
    ] satisfies [string, PreparedYieldDepositAction | null][])(
        'shows an alert when the prepared action is %s',
        (_caseName, submitPreparedAction) => {
            const onActionReady = jest.fn();
            const { result } = renderHookWithBasicProvider(() =>
                useYieldDepositSubmit({
                    amount: '1',
                    onActionReady,
                    preparedAction: submitPreparedAction,
                }),
            );

            act(() => result.current.handleSubmitDeposit());

            expect(onActionReady).not.toHaveBeenCalled();
            expect(showYieldAlert).toHaveBeenCalledWith({
                title: 'earn.yieldDepositFlowScreen.alerts.depositUnavailable.title',
                description: 'earn.yieldDepositFlowScreen.alerts.depositUnavailable.description',
            });
        },
    );
});
