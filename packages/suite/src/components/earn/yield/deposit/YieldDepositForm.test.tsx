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
        approvalAction: 'increase',
        canRevokeAllowance: true,
        skipApprove: mockSkipApprove,
    }),
}));
jest.mock('../common/YieldFlowStepList', () => ({
    YieldFlowStepList: ({ steps }: MockStepListProps) =>
        steps.approve.content({ state: 'active', indicator: { index: 1, total: 2 } }),
}));
jest.mock('../common/YieldApproveStep', () => ({
    YieldApproveStep: ({ onSkip }: YieldApproveStepProps) => (
        <button onClick={onSkip}>Skip approval</button>
    ),
}));

describe('YieldDepositForm analytics', () => {
    it('continues with an existing allowance without reporting an approval cancellation', () => {
        const { getByRole } = render(<YieldDepositForm />);

        fireEvent.click(getByRole('button', { name: 'Skip approval' }));

        expect(mockSkipApprove).toHaveBeenCalledTimes(1);
        expect(mockAnalytics.report).toHaveBeenCalledWith({
            type: 'yield/deposit',
            payload: {
                type: 'approve-skipped',
                action: 'continue',
                networkSymbol: 'eth',
                vaultId: 'vault-1',
            },
        });
    });
});
