import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';

import { type AppState } from 'src/reducers/store';
import { type SendSession, SendSessionContext } from 'src/support/chainSend/SendSessionContext';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { DeviceContextModal } from './DeviceContextModal';
import { mockInitialAppState } from '../../../../../../mocks/mockInitialAppState';

jest.mock('@suite-common/device', () => {
    const device = jest.requireActual('@suite-common/suite-types/mocks').mockSuiteDevice();

    return { ...jest.requireActual('@suite-common/device'), selectSelectedDevice: () => device };
});

jest.mock('../TransactionReviewModal/TransactionReviewModal', () => ({
    TransactionReviewModal: () => <div data-testid="transaction-review" />,
}));

jest.mock('./ConfirmActionModal', () => ({
    ConfirmActionModal: () => <div data-testid="confirm-action" />,
}));

const runtimeSession = { kind: 'runtime' } as SendSession;
const walletSession = { kind: 'wallet' } as SendSession;

const renderPrompt = (session: SendSession | undefined) => {
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: mockInitialAppState,
    });

    renderWithProviders(
        services,
        <SendSessionContext.Provider value={{ session, setSession: jest.fn() }}>
            <DeviceContextModal
                context="@modal/context-device"
                device={mockSuiteDevice()}
                windowType="ButtonRequest_Other"
            />
        </SendSessionContext.Provider>,
    );
};

describe(DeviceContextModal.name, () => {
    it("keeps a runtime network's review open for its signing screens", () => {
        renderPrompt(runtimeSession);

        expect(screen.getByTestId('transaction-review')).toBeInTheDocument();
    });

    it.each([
        ['no send', undefined],
        ["a wallet account's send", walletSession],
    ])('asks to confirm the action during %s', (_, session) => {
        renderPrompt(session);

        expect(screen.getByTestId('confirm-action')).toBeInTheDocument();
    });
});
