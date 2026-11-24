import { type PropsWithChildren, type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { fireEvent, render } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { CARDANO_EVERSTAKE_DREP } from '@suite-common/wallet-constants';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { ServicesProvider } from '@trezor/dependency-injection';
import { type WithServices } from '@trezor/redux-utils';

import { type VotingPreferenceOption } from '#src/components/earn/modals/shared/VotingDelegations/VotingPreferenceCard';

import { StakeChangeDelegateModalLoaded } from './StakeChangeDelegateModal';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../../mocks/mockInitialAppState';

const mockAnalytics = mockDesktopAnalytics();
const mockReport = jest.mocked(mockAnalytics.report);
const mockSignTx = jest.fn();
const mockVotingPreferenceCard = jest.fn();
const mockAccount = mockWalletAccount({ symbol: asNetworkSymbol('ada') });
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
        Modal: Object.assign(
            ({ bottomContent, children }: PropsWithChildren<{ bottomContent: ReactNode }>) => (
                <>
                    {children}
                    {bottomContent}
                </>
            ),
            {
                Button: ({ onClick, isDisabled }: { onClick: () => void; isDisabled: boolean }) => (
                    <button onClick={onClick} disabled={isDisabled}>
                        Submit
                    </button>
                ),
            },
        ),
    };
});
jest.mock('#src/hooks/suite/useMessageSystemStaking', () => ({
    useMessageSystemStaking: () => ({ isVotingDisabled: false }),
}));
jest.mock('#src/hooks/wallet/useChangeDelegateForm', () => ({
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
jest.mock('#src/components/earn/modals/shared/VotingDelegations/VotingPreferenceCard', () => ({
    BASE_VOTING_PREFERENCE_OPTIONS: [
        { type: 'abstain', label: 'TR_STAKING_VOTE_ABSTAIN' },
        { type: 'everstake', label: 'TR_STAKING_VOTE_LET_EVERSTAKE_VOTE' },
        { type: 'another_drep', label: 'TR_STAKING_VOTE_CHOOSE_OWN_DREP' },
    ],
    VotingPreferenceCard: (props: { options: VotingPreferenceOption[] }) => {
        mockVotingPreferenceCard(props);

        return null;
    },
}));
jest.mock('#src/components/wallet/Fees/Fees', () => ({ Fees: () => null }));
jest.mock('./CurrentVotingPreference', () => ({ CurrentVotingPreference: () => null }));

const renderChangeDelegateModal = (account: Account, device = mockSuiteDevice()) => {
    const { services } = createTestCompositionRoot<
        WithServices<DesktopAnalyticsDep>,
        MockSuiteState
    >({
        preloadedState: {
            ...mockInitialAppState,
            device: { ...mockInitialAppState.device, selectedDevice: device },
            wallet: {
                ...mockInitialAppState.wallet,
                stake: {
                    ...mockInitialAppState.wallet.stake,
                    votingDelegation: { accountKey: account.key, option: { type: 'abstain' } },
                },
            },
        },
        services: () => ({ analytics: mockAnalytics }),
    });

    return render(
        <Provider store={services.store}>
            <ServicesProvider services={services}>
                <StakeChangeDelegateModalLoaded
                    selectedAccount={{
                        status: 'loaded',
                        account,
                        network: getNetwork(account.symbol),
                        params: undefined,
                    }}
                />
            </ServicesProvider>
        </Provider>,
    );
};

describe('change delegate submit analytics', () => {
    beforeEach(() => jest.clearAllMocks());

    it.each([
        { device: mockSuiteDevice({ connected: true, available: true }), status: 'connected' },
        { device: mockSuiteDevice({ connected: false, available: false }), status: 'disconnected' },
        { device: mockSuiteDevice({ connected: true, available: false }), status: 'unavailable' },
    ])('reports device status before signing ($status)', ({ device, status }) => {
        const view = renderChangeDelegateModal(mockAccount, device);

        expect(mockReport).not.toHaveBeenCalled();
        fireEvent.click(view.getByRole('button'));

        expect(mockReport).toHaveBeenCalledTimes(1);
        expect(mockReport).toHaveBeenCalledWith({
            type: 'staking/change-delegate',
            payload: {
                action: 'continue',
                step: 'change-delegate-form-modal',
                networkSymbol: 'ada',
                deviceStatus: status,
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

describe('change delegate voting options', () => {
    // Recurring bug: https://github.com/trezor/trezor-suite/issues/31984
    it('offers every vote except the one the account already delegates to', () => {
        const everstakeVoter: Account = mockWalletAccount(
            { symbol: asNetworkSymbol('ada') },
            { misc: { staking: { drep: { drep_id: CARDANO_EVERSTAKE_DREP.bech32 } } } },
        );
        renderChangeDelegateModal(everstakeVoter);

        const [{ options }] = mockVotingPreferenceCard.mock.lastCall;
        expect(options.map((option: VotingPreferenceOption) => option.type)).toEqual([
            'abstain',
            'another_drep',
        ]);
    });
});
