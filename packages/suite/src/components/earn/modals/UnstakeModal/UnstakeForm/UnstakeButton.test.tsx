import { fireEvent, screen } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type NetworkSymbol, asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { mockCardanoStakingAccount, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';
import { type WithServices } from '@trezor/redux-utils';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { UnstakeButton } from './UnstakeButton';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../mocks/mockInitialAppState';

let mockSymbol: NetworkSymbol = asNetworkSymbol('ada');
let mockTransactionType: 'final' | 'nonfinal' | 'error' | undefined;
const mockSign = mock<() => Promise<void>>();
const device = mockSuiteDevice({ connected: true, available: true });

jest.mock('@suite/device', () => ({
    useDevice: () => ({ device, isLocked: () => false }),
}));
jest.mock('#src/hooks/earn/useEarnDeviceStatus', () => ({
    useEarnDeviceStatus: () => 'connected',
}));
jest.mock('#src/hooks/suite/useMessageSystemStaking', () => ({
    useMessageSystemStaking: () => ({ isUnstakingDisabled: false }),
}));
jest.mock('#src/hooks/earn/useWithdrawalForm', () => ({
    useWithdrawalFormContext: () => ({
        account:
            mockSymbol === 'ada'
                ? mockCardanoStakingAccount('everstake')
                : mockWalletAccount({ symbol: mockSymbol }),
        network: getNetwork(mockSymbol),
        formState: { errors: {}, isSubmitting: false },
        watch: () => '1',
        signTx: mockSign,
        handleSubmit: (callback: () => void) => callback,
        selectedFee: 'normal',
        composedLevels: mockTransactionType ? { normal: { type: mockTransactionType } } : undefined,
    }),
}));

const renderButton = ({ isDiscovering = false, areFeesLoading = false } = {}) => {
    const preloadedState: MockSuiteState = {
        ...mockInitialAppState,
        device: { ...mockInitialAppState.device, selectedDevice: device },
        wallet: {
            ...mockInitialAppState.wallet,
            discovery: isDiscovering ? { [device.path]: { status: 'starting' } } : {},
            fees: areFeesLoading ? { [mockSymbol]: { status: 'loading' } } : {},
        },
    };
    const { services } = createTestCompositionRoot<
        WithServices<DesktopAnalyticsDep>,
        MockSuiteState
    >({
        preloadedState,
        services: () => ({ analytics: mockDesktopAnalytics() }),
    });

    return renderWithProviders(services, <UnstakeButton />);
};

const getButton = () => screen.getByTestId('@modal/staking/unstake-button');

describe.each(['ada', 'eth', 'sol'])('Unstake Continue on %s', symbol => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSymbol = asNetworkSymbol(symbol);
    });

    it.each([undefined, 'nonfinal', 'error'] as const)('is disabled for a %s transaction', type => {
        mockTransactionType = type;
        renderButton();

        expect(getButton()).toBeDisabled();
        fireEvent.click(getButton());
        expect(mockSign).not.toHaveBeenCalled();
    });

    it.each([{ isDiscovering: true }, { areFeesLoading: true }])(
        'disables Continue while Redux reports loading (%j)',
        loading => {
            mockTransactionType = 'final';
            renderButton(loading);

            expect(getButton()).toBeDisabled();
        },
    );

    it('continues with a final transaction', () => {
        mockTransactionType = 'final';
        renderButton();

        expect(getButton()).toBeEnabled();
        fireEvent.click(getButton());
        expect(mockSign).toHaveBeenCalledTimes(1);
    });
});
