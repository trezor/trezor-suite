import { type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { fireEvent, render } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { setConnectionModal } from '@suite/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { ServicesProvider, mock } from '@trezor/dependency-injection';
import { type WithServices } from '@trezor/redux-utils';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import { StakeButton } from './StakeButton';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../mocks/mockInitialAppState';

const mockReport = mock<DesktopAnalyticsDep['analytics']['report']>();
const mockSubmit = jest.fn();
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
        onSubmit: mockSubmit,
        handleSubmit: (callback: () => void) => callback,
        formState: { errors: {}, isSubmitting: false },
        watch: () => '1',
        currency: 'crypto',
    }),
}));

describe('StakeButton device connection analytics', () => {
    beforeEach(() => jest.clearAllMocks());

    it.each([
        { connected: true, available: true, expectedStatus: 'connected' },
        { connected: false, available: false, expectedStatus: 'disconnected' },
        { connected: true, available: false, expectedStatus: 'unavailable' },
    ])('reports one submit attempt before the connection guard ($connected/$available)', device => {
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
        const mockDispatch = createMockDispatch({ getState: services.store.getState });
        const dispatch = mock(mockDispatch.dispatch);
        const { getByRole } = render(
            <Provider store={services.store}>
                <ServicesProvider
                    services={{ ...services, store: { ...services.store, dispatch } }}
                >
                    <StakeButton flow={EarnFlow.Stake} />
                </ServicesProvider>
            </Provider>,
        );

        expect(mockReport).not.toHaveBeenCalled();
        fireEvent.click(getByRole('button'));

        const isConnectionBlocked = !device.connected || !device.available;
        expect(mockReport).toHaveBeenCalledTimes(1);
        expect(mockReport).toHaveBeenCalledWith({
            type: 'staking/stake',
            payload: {
                action: 'continue',
                step: 'stake-form-modal',
                currency: 'crypto',
                networkSymbol: 'eth',
                deviceStatus: device.expectedStatus,
            },
        });
        if (isConnectionBlocked) {
            expect(dispatch).toHaveBeenCalledWith(setConnectionModal(true));
            expect(mockSubmit).not.toHaveBeenCalled();
            const [reportOrder] = mockReport.mock.invocationCallOrder;
            const [dispatchOrder] = dispatch.mock.invocationCallOrder;
            if (reportOrder === undefined || dispatchOrder === undefined) {
                throw new Error('Missing analytics report or connection guard call');
            }
            expect(reportOrder).toBeLessThan(dispatchOrder);
        } else {
            expect(mockSubmit).toHaveBeenCalledTimes(1);
            expect(dispatch).not.toHaveBeenCalled();
        }
    });
});
