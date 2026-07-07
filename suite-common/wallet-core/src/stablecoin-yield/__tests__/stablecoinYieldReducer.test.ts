import {
    type StablecoinYieldState,
    getStablecoinYieldSessionKey,
    initialStablecoinYieldState,
    stablecoinYieldActions,
    stablecoinYieldReducer,
} from '../stablecoinYieldReducer';
import type { YieldFlowType } from '../stablecoinYieldTypes';

const FLOW_KEY = 'account-key:yield-id:0xtoken';

const getSession = (state: StablecoinYieldState, flowType: YieldFlowType) =>
    state[flowType][getStablecoinYieldSessionKey(FLOW_KEY)];

const initSession = (flowType: YieldFlowType) =>
    stablecoinYieldReducer(
        initialStablecoinYieldState,
        stablecoinYieldActions.initSession({ flowType, flowKey: FLOW_KEY }),
    );

describe('stablecoinYieldReducer', () => {
    describe('step machine', () => {
        it('starts deposit at the approve step', () => {
            const state = initSession('deposit');

            expect(getSession(state, 'deposit')?.step).toBe('approve');
        });

        it.each(['withdraw', 'redeem', 'claim'] as const)(
            'starts %s at the action step',
            flowType => {
                const state = initSession(flowType);

                expect(getSession(state, flowType)?.step).toBe('action');
            },
        );

        it('moves deposit to the action step when approval completes', () => {
            const state = stablecoinYieldReducer(
                initSession('deposit'),
                stablecoinYieldActions.completeApproval({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    amount: '10',
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('action');
            expect(getSession(state, 'deposit')?.action.amount).toBe('10');
        });

        it('moves deposit to the action step when the approval step is skipped', () => {
            const state = stablecoinYieldReducer(
                initSession('deposit'),
                stablecoinYieldActions.skipApprovalStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('action');
        });

        it('keeps deposit on the action step when the approval skip repeats', () => {
            // The allowance refetch after a confirmed approve tx dispatches skipApprovalStep
            // again; it must not advance the flow past the action step.
            const skipAction = stablecoinYieldActions.skipApprovalStep({
                flowType: 'deposit',
                flowKey: FLOW_KEY,
            });
            const state = stablecoinYieldReducer(
                stablecoinYieldReducer(initSession('deposit'), skipAction),
                skipAction,
            );

            expect(getSession(state, 'deposit')?.step).toBe('action');
        });

        it('completes deposit from the action step', () => {
            const state = stablecoinYieldReducer(
                stablecoinYieldReducer(
                    initSession('deposit'),
                    stablecoinYieldActions.skipApprovalStep({
                        flowType: 'deposit',
                        flowKey: FLOW_KEY,
                    }),
                ),
                stablecoinYieldActions.completeAction({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    amount: '10',
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('complete');
            expect(getSession(state, 'deposit')?.result.completedAmount).toBe('10');
        });

        it('completes claim from the action step', () => {
            const state = stablecoinYieldReducer(
                initSession('claim'),
                stablecoinYieldActions.completeAction({
                    flowType: 'claim',
                    flowKey: FLOW_KEY,
                    amount: '0',
                }),
            );

            expect(getSession(state, 'claim')?.step).toBe('complete');
        });

        it('returns deposit to the approve step when entering modify mode', () => {
            const state = stablecoinYieldReducer(
                stablecoinYieldReducer(
                    initSession('deposit'),
                    stablecoinYieldActions.skipApprovalStep({
                        flowType: 'deposit',
                        flowKey: FLOW_KEY,
                    }),
                ),
                stablecoinYieldActions.enterModifyMode({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('approve');
        });
    });
});
