import '@suite-common/test-utils/src/globalOverrides';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type TrezorDeviceWithState } from '@suite-common/suite-types/src/device';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId } from '@trezor/connect';

import { type AppState } from 'src/reducers/store';
import { initialAppState } from 'src/support/tests/__fixtures__/defaultAppState';

import { AddAccountModal } from '../AddAccountModal';

const mockDispatch = jest.fn();
const mockPrepareNewAccountPayload = jest.fn();
const mockUseSelector = jest.fn();

const deviceSessionId = 'device-session-id' as StaticSessionId;
const device = mockSuiteDevice({
    connected: true,
    available: true,
    state: { staticSessionId: deviceSessionId } as NonNullable<TrezorDeviceWithState['state']>,
}) as TrezorDeviceWithState;

let mockState: AppState;

jest.mock('@suite/intl', () => ({
    Translation: ({ id }: { id: string }) => <span>{id}</span>,
}));

jest.mock('@suite-common/wallet-utils', () => {
    const actual = jest.requireActual('@suite-common/wallet-utils');

    return {
        ...actual,
        prepareNewAccountPayload: (...args: unknown[]) => mockPrepareNewAccountPayload(...args),
    };
});

jest.mock('@trezor/components', () => {
    const Modal = ({ children, bottomContent }: any) => (
        <div>
            <div>{children}</div>
            <div>{bottomContent}</div>
        </div>
    );

    Modal.Button = ({ children, ...props }: any) => <button {...props}>{children}</button>;

    return {
        CollapsibleBox: ({ children }: any) => <div>{children}</div>,
        Modal,
        Tooltip: ({ children }: any) => <div>{children}</div>,
    };
});

jest.mock('src/components/suite/CoinList/CoinList', () => ({
    CoinList: () => null,
}));

jest.mock('src/components/wallet/WalletLayout/AccountsMenu/useAvailableNetworkSymbols', () => ({
    useAvailableNetworkSymbols: () => ['tsep'],
}));

jest.mock('src/hooks/settings/useNetworkSupport', () => ({
    useNetworkSupport: () => ({
        showUnsupportedCoins: false,
        supportedMainnets: [],
        supportedTestnets: [require('@suite-common/wallet-config').networks.tsep],
        unsupportedMainnets: [],
    }),
}));

jest.mock('src/hooks/suite', () => ({
    useDispatch: () => mockDispatch,
    useSelector: (selector: (state: AppState) => unknown) => mockUseSelector(selector),
}));

jest.mock('../AccountTypeSelect/AccountTypeSelect', () => ({
    AccountTypeSelect: () => null,
}));

jest.mock('../AddAccountButton/AddAccountButton', () => ({
    AddAccountButton: ({ onAddNewAccount }: { onAddNewAccount: () => void }) => (
        <button data-testid="@add-account" onClick={onAddNewAccount}>
            Add account
        </button>
    ),
}));

jest.mock('../SelectNetwork', () => ({
    SelectNetwork: () => null,
}));

describe('AddAccountModal', () => {
    beforeEach(() => {
        mockState = {
            ...initialAppState,
            device: {
                ...initialAppState.device,
                selectedDevice: device,
            },
            wallet: {
                ...initialAppState.wallet,
                accounts: [
                    mockWalletAccount({
                        accountType: 'legacy',
                        deviceState: deviceSessionId,
                        index: 0,
                        path: "m/44'/1'/0'/0/0",
                        symbol: 'tsep',
                    }),
                ],
                settings: {
                    ...initialAppState.wallet.settings,
                    enabledNetworks: ['tsep'],
                },
            },
        } as AppState;

        mockDispatch.mockReset();
        mockPrepareNewAccountPayload.mockReset();
        mockPrepareNewAccountPayload.mockResolvedValue(new Error('Discovery failed'));
        mockUseSelector.mockImplementation(selector => selector(mockState));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('creates the first Sepolia normal account from the available account type definition', async () => {
        render(<AddAccountModal device={device} onCancel={jest.fn()} symbol="tsep" />);

        fireEvent.click(screen.getByTestId('@add-account'));

        await waitFor(() =>
            expect(mockPrepareNewAccountPayload).toHaveBeenCalledWith(
                expect.objectContaining({
                    accountType: 'normal',
                    device,
                    index: 0,
                    networkSymbol: 'tsep',
                    selectedAccount: undefined,
                }),
            ),
        );
    });
});
