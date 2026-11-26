import { type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { fireEvent, render } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { ServicesProvider, mock } from '@trezor/dependency-injection';
import { type WithServices } from '@trezor/redux-utils';

import { StakeButton } from './StakeButton';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../mocks/mockInitialAppState';

const mockReport = mock<DesktopAnalyticsDep['analytics']['report']>();
const mockSubmit = jest.fn();
let mockHasFee = true;
jest.mock('@suite/intl', () => ({ Translation: () => null }));
jest.mock('@trezor/components', () => ({
    Tooltip: ({ children }: PropsWithChildren) => children,
    Modal: {
        Button: ({ onClick, isDisabled }: { onClick: () => void; isDisabled: boolean }) => (
            <button onClick={onClick} disabled={isDisabled}>
                Submit
            </button>
        ),
    },
}));
jest.mock('#src/hooks/suite/useMessageSystemStaking', () => ({
    useMessageSystemStaking: () => ({ isStakingDisabled: false }),
}));
jest.mock('#src/hooks/earn/useStakeForm', () => ({
    useStakeFormContext: () => ({
        account: mockWalletAccount({ symbol: asNetworkSymbol('eth') }),
        network: getNetwork(asNetworkSymbol('eth')),
        selectedFee: 'normal',
        composedLevels: mockHasFee ? { normal: { type: 'final' } } : undefined,
        onSubmit: mockSubmit,
        handleSubmit: (callback: () => void) => callback,
        formState: { errors: {}, isSubmitting: false },
        watch: () => '1',
        currency: 'crypto',
    }),
}));

type DeviceConnection = Pick<TrezorDevice, 'connected' | 'available'>;

const renderStakeButton = (device: DeviceConnection) => {
    const { services } = createTestCompositionRoot<
        WithServices<DesktopAnalyticsDep>,
        MockSuiteState
    >({
        preloadedState: {
            ...mockInitialAppState,
            device: {
                ...mockInitialAppState.device,
                selectedDevice: mockSuiteDevice(device),
            },
        },
        services: () => ({ analytics: mockDesktopAnalytics(mockReport) }),
    });

    return render(
        <Provider store={services.store}>
            <ServicesProvider services={services}>
                <StakeButton flow={EarnFlow.Stake} />
            </ServicesProvider>
        </Provider>,
    );
};

describe('StakeButton device connection analytics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockHasFee = true;
    });

    it.each([true, false])(
        'allows recovery of a missing composition only when disconnected (connected=%s)',
        connected => {
            mockHasFee = false;
            const { getByRole } = renderStakeButton({ connected, available: connected });

            fireEvent.click(getByRole('button'));

            expect(mockSubmit).toHaveBeenCalledTimes(connected ? 0 : 1);
        },
    );

    it.each([
        { connected: true, available: true, expectedStatus: 'connected' },
        { connected: false, available: false, expectedStatus: 'disconnected' },
        { connected: true, available: false, expectedStatus: 'unavailable' },
    ])(
        'continues to the terms and reports the device status ($connected/$available)',
        ({ connected, available, expectedStatus }) => {
            const { getByRole } = renderStakeButton({ connected, available });

            expect(mockReport).not.toHaveBeenCalled();
            fireEvent.click(getByRole('button'));

            expect(mockReport).toHaveBeenCalledTimes(1);
            expect(mockReport).toHaveBeenCalledWith({
                type: 'staking/stake',
                payload: {
                    action: 'continue',
                    step: 'stake-form-modal',
                    currency: 'crypto',
                    networkSymbol: 'eth',
                    deviceStatus: expectedStatus,
                },
            });
            expect(mockSubmit).toHaveBeenCalledTimes(1);
        },
    );
});
