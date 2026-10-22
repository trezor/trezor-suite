import { type PropsWithChildren } from 'react';

import { fireEvent, render } from '@testing-library/react';

import { type DesktopAnalytics } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';

import { YieldDepositForm } from './YieldDepositForm';
import { type YieldApproveStepProps } from '../common/YieldApproveStep';
import { type YieldFlowStepDefinition } from '../common/YieldFlowStepList';
import { type YieldFlowContextValues } from '../hooks/useYieldFlow';

type MockStepListProps = { steps: { approve: YieldFlowStepDefinition } };

const mockAnalytics = mockDesktopAnalytics(mock<DesktopAnalytics['report']>());
const mockSkipApprove = mock<YieldFlowContextValues['skipApprove']>();
const mockSubmitApprovalAction = mock<YieldFlowContextValues['submitApprovalAction']>();
let mockApprovalAction: YieldFlowContextValues['approvalAction'] = 'increase';

jest.mock('@trezor/dependency-injection', () => ({
    ...jest.requireActual('@trezor/dependency-injection'),
    useServices: () => ({ analytics: mockAnalytics }),
}));
jest.mock('@trezor/components', () => ({
    ...jest.requireActual('@trezor/components'),
    Column: ({ children }: PropsWithChildren) => <div>{children}</div>,
    Text: ({ children }: PropsWithChildren) => <span>{children}</span>,
}));
jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: () => null,
}));
jest.mock('@suite-common/formatters', () => ({
    useFormatters: () => ({ CryptoAmountFormatter: { format: () => '0' } }),
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    useFetchFees: () => undefined,
}));
jest.mock('src/hooks/suite/useMessageSystemWrappedNative', () => ({
    useMessageSystemWrappedNative: () => ({ isDisabled: false }),
}));
jest.mock('src/hooks/suite/useMessageSystemYield', () => ({
    useMessageSystemYield: () => ({ isDisabled: false }),
}));
jest.mock('src/hooks/earn/useEarnDeviceStatus', () => ({
    useEarnDeviceStatus: () => 'connected',
}));
jest.mock('src/components/wallet/Fees/CollapsibleFees/hooks/useIsFeeRefetchDisabled', () => ({
    useIsFeeRefetchDisabled: () => false,
}));
jest.mock('./useYieldDepositContext', () => ({
    useYieldDepositContext: () => ({
        account: mockWalletAccount({ symbol: asNetworkSymbol('eth') }),
        vault: { id: 'vault-1', token: { symbol: 'USDC' } },
        token: { networkSymbol: 'eth', symbol: 'USDC', balance: '10', decimals: 6 },
        receiptToken: { symbol: 'vaultUSDC' },
        amountIssues: [],
        gasReserve: { recommended: '0', minimum: '0' },
        nativeFeeStatus: 'sufficient',
        flow: { currentStep: 'approve', isWrappedNativeVault: false },
        allowanceAmount: '10',
        allowanceStatus: 'success',
        approvalAction: mockApprovalAction,
        canRevokeAllowance: true,
        skipApprove: mockSkipApprove,
        submitApprovalAction: mockSubmitApprovalAction,
    }),
}));
jest.mock('../common/YieldFlowStepList', () => ({
    YieldFlowStepList: ({ steps }: MockStepListProps) =>
        steps.approve.content({ state: 'active', indicator: { index: 1, total: 2 } }),
}));
jest.mock('../common/YieldApproveStep', () => ({
    YieldApproveStep: ({ onSkip, onApprovalSubmit }: YieldApproveStepProps) => (
        <>
            <button onClick={onSkip}>Skip approval</button>
            <button onClick={onApprovalSubmit}>Continue approval</button>
        </>
    ),
}));

describe('YieldDepositForm analytics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockApprovalAction = 'increase';
    });

    it('continues with an existing allowance without reporting an approval cancellation', () => {
        const { getByRole } = render(<YieldDepositForm />);

        fireEvent.click(getByRole('button', { name: 'Skip approval' }));

        expect(mockSkipApprove).toHaveBeenCalledTimes(1);
        expect(mockAnalytics.report).toHaveBeenCalledWith({
            type: 'yield/deposit',
            payload: {
                type: 'approve',
                action: 'skip',
                networkSymbol: 'eth',
                vaultId: 'vault-1',
            },
        });
    });

    it('reports reusing allowance as a skip while keeping live validation', () => {
        mockApprovalAction = 'continue';
        const { getByRole } = render(<YieldDepositForm />);

        fireEvent.click(getByRole('button', { name: 'Continue approval' }));

        expect(mockSkipApprove).not.toHaveBeenCalled();
        expect(mockSubmitApprovalAction).toHaveBeenCalledTimes(1);
        expect(mockAnalytics.report).toHaveBeenCalledTimes(1);
        expect(mockAnalytics.report).toHaveBeenCalledWith({
            type: 'yield/deposit',
            payload: {
                type: 'approve',
                action: 'skip',
                networkSymbol: 'eth',
                vaultId: 'vault-1',
            },
        });
    });

    it.each(['approve', 'increase', 'revoke'] as const)(
        'keeps the device snapshot for an actual %s submit',
        action => {
            mockApprovalAction = action;
            const { getByRole } = render(<YieldDepositForm />);

            fireEvent.click(getByRole('button', { name: 'Continue approval' }));

            expect(mockSubmitApprovalAction).toHaveBeenCalledTimes(1);
            expect(mockSkipApprove).not.toHaveBeenCalled();
            expect(mockAnalytics.report).toHaveBeenCalledTimes(1);
            expect(mockAnalytics.report).toHaveBeenCalledWith({
                type: 'yield/deposit',
                payload: {
                    type: action === 'revoke' ? 'revoke' : 'approve',
                    action: 'continue',
                    deviceStatus: 'connected',
                    networkSymbol: 'eth',
                    vaultId: 'vault-1',
                },
            });
        },
    );
});
