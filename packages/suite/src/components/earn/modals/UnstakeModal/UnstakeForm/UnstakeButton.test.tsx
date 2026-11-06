import { type PropsWithChildren } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { type NetworkSymbol, asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { ServicesProvider, mock } from '@trezor/dependency-injection';
import { type Dispatch, type DispatchDep } from '@trezor/redux-utils';

import { UnstakeButton } from './UnstakeButton';

let mockSymbol: NetworkSymbol = asNetworkSymbol('ada');
let mockTransactionType: 'final' | 'nonfinal' | 'error' | undefined;
const mockSign = mock<() => Promise<void>>();
const services: DesktopAnalyticsDep & { store: DispatchDep } = {
    analytics: mockDesktopAnalytics(),
    store: { dispatch: mock<Dispatch>() },
};

jest.mock('@suite/device', () => ({
    useDevice: () => ({ device: { connected: true, available: true }, isLocked: () => false }),
}));
jest.mock('@suite/intl', () => ({ Translation: () => null }));
jest.mock('@trezor/components', () => ({
    Tooltip: ({ children }: PropsWithChildren) => children,
    Modal: {
        Button: ({ onClick, isDisabled }: { onClick: () => void; isDisabled: boolean }) => (
            <button onClick={onClick} disabled={isDisabled}>
                Continue
            </button>
        ),
    },
}));
jest.mock('@suite-common/wallet-core', () => ({
    getStakingDataForNetwork: () => ({ autocompoundBalance: '1' }),
}));
jest.mock('src/hooks/suite', () => ({ useSelector: () => false }));
jest.mock('src/hooks/earn/useEarnDeviceStatus', () => ({ useEarnDeviceStatus: () => 'connected' }));
jest.mock('src/hooks/suite/useMessageSystemStaking', () => ({
    useMessageSystemStaking: () => ({ isUnstakingDisabled: false }),
}));
jest.mock('src/hooks/earn/useWithdrawalForm', () => ({
    useWithdrawalFormContext: () => ({
        account: mockWalletAccount({ symbol: mockSymbol }),
        network: getNetwork(mockSymbol),
        formState: { errors: {}, isSubmitting: false },
        watch: () => '1',
        signTx: mockSign,
        handleSubmit: (callback: () => void) => callback,
        selectedFee: 'normal',
        composedLevels: mockTransactionType ? { normal: { type: mockTransactionType } } : undefined,
    }),
}));

const renderButton = () =>
    render(
        <ServicesProvider services={services}>
            <UnstakeButton />
        </ServicesProvider>,
    );

describe.each(['ada', 'eth', 'sol'])('Unstake Continue on %s', symbol => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSymbol = asNetworkSymbol(symbol);
    });

    it.each([undefined, 'nonfinal', 'error'] as const)('is disabled for a %s transaction', type => {
        mockTransactionType = type;
        renderButton();

        expect(screen.getByRole('button')).toBeDisabled();
        fireEvent.click(screen.getByRole('button'));
        expect(mockSign).not.toHaveBeenCalled();
    });

    it('continues with a final transaction', () => {
        mockTransactionType = 'final';
        renderButton();

        expect(screen.getByRole('button')).toBeEnabled();
        fireEvent.click(screen.getByRole('button'));
        expect(mockSign).toHaveBeenCalledTimes(1);
    });
});
