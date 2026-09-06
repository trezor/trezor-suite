import { mockResolvedYieldFlowData, mockYieldSessionState } from '@suite-common/wallet-core/mocks';

import { type useYieldFlowScreenBase } from '../src/hooks/yield/controllers/useYieldFlowScreenBase';

type YieldFlowScreenBaseResult = ReturnType<typeof useYieldFlowScreenBase>;

export const mockYieldFlowScreenBaseResult = (
    overrides: Partial<YieldFlowScreenBaseResult> = {},
): YieldFlowScreenBaseResult => ({
    isFocused: true,
    messageSystem: { isDisabled: false, content: undefined, variant: undefined },
    session: mockYieldSessionState(),
    yieldFlowData: mockResolvedYieldFlowData(),
    ...overrides,
});
