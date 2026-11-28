import { render, screen } from '@testing-library/react';

import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { ConfirmXpubModal } from './ConfirmXpubModal';

type MockState = {
    connectPopup: { activeCall?: { state: string } };
    device: { selectedDevice?: ReturnType<typeof mockSuiteDevice> };
    wallet: { selectedAccount: { account?: Account } };
};

const mockAccount = mockWalletAccount({ symbol: asNetworkSymbol('ada') });
let mockState: MockState;

jest.mock('#src/hooks/suite/useSelector', () => ({
    useSelector: (selector: (state: MockState) => unknown) => selector(mockState),
}));
jest.mock('#src/actions/wallet/publicKeyActions', () => ({ showXpubThunk: jest.fn() }));
jest.mock('./ConfirmValueModal/ConfirmValueModal', () => ({
    ConfirmValueModal: () => 'confirm-value-modal',
}));
jest.mock('./DeviceContextModal/ConfirmActionModal', () => ({
    ConfirmActionModal: () => 'confirm-action-modal',
}));
jest.mock('./UserContextModal/ConnectAddressConfirmation', () => ({
    ConnectAddressConfirmation: () => 'connect-address-confirmation',
}));
jest.mock('./UserContextModal/ConnectSelectAccount/ConnectSelectAccount', () => ({
    ConnectSelectAccount: () => 'connect-select-account',
}));

const setState = ({ popupCallState, account }: { popupCallState?: string; account?: Account }) => {
    mockState = {
        connectPopup: { activeCall: popupCallState ? { state: popupCallState } : undefined },
        device: { selectedDevice: mockSuiteDevice() },
        wallet: { selectedAccount: { account } },
    };
};

describe('ConfirmXpubModal', () => {
    it('keeps the Connect account picker on screen while it verifies an xpub', () => {
        setState({ popupCallState: 'select-account', account: mockAccount });

        render(<ConfirmXpubModal />);

        expect(screen.getByText('connect-select-account')).toBeTruthy();
    });

    it('shows the Connect address confirmation during an address-confirmation call', () => {
        setState({ popupCallState: 'address-confirmation' });

        render(<ConfirmXpubModal />);

        expect(screen.getByText('connect-address-confirmation')).toBeTruthy();
    });

    it('shows the xpub of the selected account outside a Connect call', () => {
        setState({ account: mockAccount });

        render(<ConfirmXpubModal />);

        expect(screen.getByText('confirm-value-modal')).toBeTruthy();
    });

    it('falls back to a generic confirmation without a selected account', () => {
        setState({});

        render(<ConfirmXpubModal />);

        expect(screen.getByText('confirm-action-modal')).toBeTruthy();
    });
});
