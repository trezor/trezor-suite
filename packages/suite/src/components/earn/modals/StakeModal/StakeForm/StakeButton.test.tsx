import { type PropsWithChildren } from 'react';

import { fireEvent, render } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { setConnectionModal } from '@suite/device';
import { MODAL_CONTEXT_NONE } from '@suite/modal';
import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { ServicesProvider, mock } from '@trezor/dependency-injection';
import { type Dispatch, type DispatchDep } from '@trezor/redux-utils';

import { StakeButton } from './StakeButton';

const mockReport = jest.fn();
const mockDispatch = mock<Dispatch>();
const mockSubmit = jest.fn();
let mockDevice = { connected: true, available: true };

jest.mock('@suite/device', () => ({
    ...jest.requireActual('@suite/device'),
    useDevice: () => ({ device: mockDevice, isLocked: () => false }),
}));
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
jest.mock('src/hooks/suite', () => ({
    useSelector: (selector: (state: object) => unknown) =>
        selector({ modal: { context: MODAL_CONTEXT_NONE } }),
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectHasRunningDiscovery: () => false,
    selectAreFeesLoading: () => false,
    selectVotingDelegationOption: () => ({ type: 'abstain' }),
}));
jest.mock('src/hooks/suite/useMessageSystemStaking', () => ({
    useMessageSystemStaking: () => ({ isStakingDisabled: false }),
}));
jest.mock('src/hooks/earn/useStakeForm', () => ({
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
        mockDevice = device;
        const services: DesktopAnalyticsDep & { store: DispatchDep } = {
            analytics: mockDesktopAnalytics(mockReport),
            store: { dispatch: mockDispatch },
        };
        const { getByRole } = render(
            <ServicesProvider services={services}>
                <StakeButton flow={EarnFlow.Stake} />
            </ServicesProvider>,
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
            expect(mockDispatch).toHaveBeenCalledWith(setConnectionModal(true));
            expect(mockSubmit).not.toHaveBeenCalled();
            const [reportOrder] = mockReport.mock.invocationCallOrder;
            const [dispatchOrder] = mockDispatch.mock.invocationCallOrder;
            if (reportOrder === undefined || dispatchOrder === undefined) {
                throw new Error('Missing analytics report or connection guard call');
            }
            expect(reportOrder).toBeLessThan(dispatchOrder);
        } else {
            expect(mockSubmit).toHaveBeenCalledTimes(1);
            expect(mockDispatch).not.toHaveBeenCalled();
        }
    });
});
