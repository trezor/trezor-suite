import {
    type YieldSessionState,
    initialStablecoinYieldSessionState,
} from '../src/yield/yieldReducer';

type YieldSessionStateOverrides = Partial<
    Omit<YieldSessionState, 'approval' | 'action' | 'result'>
> & {
    approval?: Partial<YieldSessionState['approval']>;
    action?: Partial<YieldSessionState['action']>;
    result?: Partial<YieldSessionState['result']>;
};

export const mockYieldSessionState = ({
    approval,
    action,
    result,
    ...overrides
}: YieldSessionStateOverrides = {}): YieldSessionState => ({
    ...initialStablecoinYieldSessionState,
    ...overrides,
    approval: { ...initialStablecoinYieldSessionState.approval, ...approval },
    action: { ...initialStablecoinYieldSessionState.action, ...action },
    result: { ...initialStablecoinYieldSessionState.result, ...result },
});
