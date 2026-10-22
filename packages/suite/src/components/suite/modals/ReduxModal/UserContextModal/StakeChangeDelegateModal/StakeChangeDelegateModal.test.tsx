import { type PropsWithChildren, type ReactNode } from 'react';

import { fireEvent, render } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { MODAL_CONTEXT_NONE } from '@suite/modal';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { ServicesProvider, mock } from '@trezor/dependency-injection';
import { type Dispatch, type DispatchDep } from '@trezor/redux-utils';

import { StakeChangeDelegateModalLoaded } from './StakeChangeDelegateModal';

const mockAnalytics = mockDesktopAnalytics();
const mockReport = jest.mocked(mockAnalytics.report);
const mockDispatch = mock<Dispatch>();
const mockSignTx = jest.fn();
const mockAccount = mockWalletAccount({ symbol: asNetworkSymbol('ada') });
let mockDevice = { connected: true, available: true };

jest.mock('@suite/device', () => ({
    ...jest.requireActual('@suite/device'),
    useDevice: () => ({ device: mockDevice }),
}));
jest.mock('@suite/intl', () => ({ Translation: () => null }));
jest.mock('react-hook-form', () => ({
    FormProvider: ({ children }: PropsWithChildren) => children,
}));
jest.mock('@trezor/components', () => {
    const Container = ({ children }: PropsWithChildren) => children;

    return {
        Column: Container,
        Card: Container,
        Tooltip: Container,
        Banner: () => null,
        Modal: Object.assign(({ bottomContent }: { bottomContent: ReactNode }) => bottomContent, {
            Button: ({ onClick, isDisabled }: { onClick: () => void; isDisabled: boolean }) => (
                <button onClick={onClick} disabled={isDisabled}>
                    Submit
                </button>
            ),
        }),
    };
});
jest.mock('src/hooks/suite', () => ({
    useSelector: (selector: (state: object) => unknown) =>
        selector({ modal: { context: MODAL_CONTEXT_NONE } }),
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectVotingDelegationOption: () => ({ type: 'abstain' }),
    selectStakeVotingDelegation: () => ({ accountKey: mockAccount.key }),
}));
jest.mock('src/hooks/suite/useMessageSystemStaking', () => ({
    useMessageSystemStaking: () => ({ isVotingDisabled: false }),
}));
jest.mock('src/hooks/wallet/useChangeDelegateForm', () => ({
    ChangeDelegateFormContext: jest.requireActual('react').createContext(null),
    useChangeDelegateForm: () => ({
        methods: {},
        composedLevels: { normal: { type: 'final' } },
        selectedFee: 'normal',
        formState: { errors: {} },
        handleSubmit: (callback: () => void) => callback,
        signTx: mockSignTx,
    }),
}));
jest.mock('src/components/earn', () => ({
    BASE_VOTING_PREFERENCE_OPTIONS: [],
    VotingPreferenceCard: () => null,
}));
jest.mock('src/components/wallet/Fees/Fees', () => ({ Fees: () => null }));
jest.mock('./CurrentVotingPreference', () => ({ CurrentVotingPreference: () => null }));

describe('change delegate submit analytics', () => {
    beforeEach(() => jest.clearAllMocks());

    it.each([
        { connected: true, available: true, status: 'connected' },
        { connected: false, available: false, status: 'disconnected' },
        { connected: true, available: false, status: 'unavailable' },
    ])('reports device status before signing ($status)', device => {
        mockDevice = device;
        const services: DesktopAnalyticsDep & { store: DispatchDep } = {
            analytics: mockAnalytics,
            store: { dispatch: mockDispatch },
        };
        const selectedAccount: SelectedAccountLoaded = {
            status: 'loaded',
            account: mockAccount,
            network: getNetwork(mockAccount.symbol),
            params: undefined,
        };
        const view = render(
            <ServicesProvider services={services}>
                <StakeChangeDelegateModalLoaded selectedAccount={selectedAccount} />
            </ServicesProvider>,
        );

        expect(mockReport).not.toHaveBeenCalled();
        fireEvent.click(view.getByRole('button'));

        expect(mockReport).toHaveBeenCalledTimes(1);
        expect(mockReport).toHaveBeenCalledWith({
            type: 'staking/change-delegate',
            payload: {
                action: 'continue',
                step: 'change-delegate-form-modal',
                networkSymbol: 'ada',
                deviceStatus: device.status,
            },
        });
        expect(mockSignTx).toHaveBeenCalledTimes(1);
        const [reportOrder] = mockReport.mock.invocationCallOrder;
        const [signOrder] = mockSignTx.mock.invocationCallOrder;
        if (reportOrder === undefined || signOrder === undefined) {
            throw new Error('Missing analytics report or signing call');
        }
        expect(reportOrder).toBeLessThan(signOrder);
    });
});
