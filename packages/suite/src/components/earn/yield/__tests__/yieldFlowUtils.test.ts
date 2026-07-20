import { getYieldFlowStepSequence } from '@suite-common/wallet-core';

import { getYieldFlowSteps } from '../yieldFlowUtils';

const depositSequence = getYieldFlowStepSequence({ flowType: 'deposit' });
const depositWithWrapSequence = getYieldFlowStepSequence({
    flowType: 'deposit',
    isWrappedNativeVault: true,
});
const withdrawSequence = getYieldFlowStepSequence({ flowType: 'withdraw' });
const withdrawWithUnwrapSequence = getYieldFlowStepSequence({
    flowType: 'withdraw',
    isWrappedNativeVault: true,
});

describe('yieldFlowUtils', () => {
    describe('getYieldFlowSteps', () => {
        // A normal deposit lists only approve + action (the leading `wrap` step is native-only and
        // excluded from the list), so `wrap` shows as an out-of-flow (done, unnumbered) step.
        it('describes deposit steps on the approve step', () => {
            expect(getYieldFlowSteps(depositSequence, 'approve')).toEqual({
                wrap: { state: 'done', indicator: { index: 0, total: 2 } },
                approve: { state: 'active', indicator: { index: 1, total: 2 } },
                action: { state: 'pending', indicator: { index: 2, total: 2 } },
                unwrap: { state: 'done', indicator: { index: 0, total: 2 } },
                complete: { state: 'pending', indicator: { index: 0, total: 2 } },
            });
        });

        it('describes deposit steps on the action step', () => {
            expect(getYieldFlowSteps(depositSequence, 'action')).toEqual({
                wrap: { state: 'done', indicator: { index: 0, total: 2 } },
                approve: { state: 'done', indicator: { index: 1, total: 2 } },
                action: { state: 'active', indicator: { index: 2, total: 2 } },
                unwrap: { state: 'done', indicator: { index: 0, total: 2 } },
                complete: { state: 'pending', indicator: { index: 0, total: 2 } },
            });
        });

        it('describes deposit steps on the complete step', () => {
            expect(getYieldFlowSteps(depositSequence, 'complete')).toEqual({
                wrap: { state: 'done', indicator: { index: 0, total: 2 } },
                approve: { state: 'done', indicator: { index: 1, total: 2 } },
                action: { state: 'done', indicator: { index: 2, total: 2 } },
                unwrap: { state: 'done', indicator: { index: 0, total: 2 } },
                complete: { state: 'active', indicator: { index: 0, total: 2 } },
            });
        });

        it('describes wrap-deposit steps on the wrap step', () => {
            expect(getYieldFlowSteps(depositWithWrapSequence, 'wrap')).toEqual({
                wrap: { state: 'active', indicator: { index: 1, total: 3 } },
                approve: { state: 'pending', indicator: { index: 2, total: 3 } },
                action: { state: 'pending', indicator: { index: 3, total: 3 } },
                unwrap: { state: 'done', indicator: { index: 0, total: 3 } },
                complete: { state: 'pending', indicator: { index: 0, total: 3 } },
            });
        });

        it('describes wrap-deposit steps on the approve step', () => {
            expect(getYieldFlowSteps(depositWithWrapSequence, 'approve')).toEqual({
                wrap: { state: 'done', indicator: { index: 1, total: 3 } },
                approve: { state: 'active', indicator: { index: 2, total: 3 } },
                action: { state: 'pending', indicator: { index: 3, total: 3 } },
                unwrap: { state: 'done', indicator: { index: 0, total: 3 } },
                complete: { state: 'pending', indicator: { index: 0, total: 3 } },
            });
        });

        it('describes unwrap-withdraw steps on the unwrap step', () => {
            expect(getYieldFlowSteps(withdrawWithUnwrapSequence, 'unwrap')).toEqual({
                wrap: { state: 'done', indicator: { index: 0, total: 2 } },
                approve: { state: 'done', indicator: { index: 0, total: 2 } },
                action: { state: 'done', indicator: { index: 1, total: 2 } },
                unwrap: { state: 'active', indicator: { index: 2, total: 2 } },
                complete: { state: 'pending', indicator: { index: 0, total: 2 } },
            });
        });

        it('numbers the complete step when it is displayed as a list item', () => {
            expect(
                getYieldFlowSteps(depositSequence, 'approve', ['approve', 'action', 'complete']),
            ).toEqual({
                wrap: { state: 'done', indicator: { index: 0, total: 3 } },
                approve: { state: 'active', indicator: { index: 1, total: 3 } },
                action: { state: 'pending', indicator: { index: 2, total: 3 } },
                unwrap: { state: 'done', indicator: { index: 0, total: 3 } },
                complete: { state: 'pending', indicator: { index: 3, total: 3 } },
            });
        });

        it('reports steps outside the flow as passed', () => {
            expect(getYieldFlowSteps(withdrawSequence, 'action')).toEqual({
                wrap: { state: 'done', indicator: { index: 0, total: 1 } },
                approve: { state: 'done', indicator: { index: 0, total: 1 } },
                action: { state: 'active', indicator: { index: 1, total: 1 } },
                unwrap: { state: 'done', indicator: { index: 0, total: 1 } },
                complete: { state: 'pending', indicator: { index: 0, total: 1 } },
            });
        });
    });
});
