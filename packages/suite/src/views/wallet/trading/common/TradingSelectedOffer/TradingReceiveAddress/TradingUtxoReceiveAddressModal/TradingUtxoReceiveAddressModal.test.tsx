import '@suite-common/test-utils/globalOverrides';

import { fireEvent, screen } from '@testing-library/react';

import { initialMetadataState } from '@suite/metadata';
import { mockAddressValidator } from '@suite-common/address/mocks';
import { createSuiteSyncAddressId } from '@suite-common/suite-sync-storage';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { configureMockStore } from '@suite-common/test-utils';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { type Account, asAccountDescriptor, createAccountKey } from '@suite-common/wallet-types';
import { type Address } from '@trezor/blockchain-link-types';
import { type WalletDescriptor } from '@trezor/device-utils';

import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { TradingUtxoReceiveAddressModal } from './TradingUtxoReceiveAddressModal';
import { mockInitialAppState } from '../../../../../../../../mocks/mockInitialAppState';
import { useTradingReceiveAddressValues } from '../useTradingReceiveAddressValues';

global.ResizeObserver = class MockedResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
};

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: { id: string }) => <span data-testid={id}>{id}</span>,
}));

jest.mock('../useTradingReceiveAddressValues', () => ({
    useTradingReceiveAddressValues: jest.fn(),
}));

jest.mock(
    'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls',
    () => ({
        useReceiveAddressModalControls: () => ({
            activeModal: 'utxoAddressModal',
            open: jest.fn(),
            close: jest.fn(),
        }),
    }),
);

const OPTION = '@trading/bitcoin-receive-address-modal/option';
const SEARCH_INPUT = '@asset-picker/search/input';

const DEVICE_SSID = 'btcWallet@deviceId:0' as const;
const WALLET_DESCRIPTOR = 'btcWallet' as WalletDescriptor;
const ACCOUNT_DESCRIPTOR = asAccountDescriptor('btcDescriptor');

const ACCOUNT_KEY = createAccountKey({
    accountDescriptor: ACCOUNT_DESCRIPTOR,
    networkSymbol: 'btc',
    deviceStaticSessionId: DEVICE_SSID,
});

const mockAddress = (address: string, path: string, received: string): Address => ({
    address,
    path,
    transfers: received === '0' ? 0 : 1,
    balance: received,
    sent: '0',
    received,
});

const LABELED_USED = mockAddress('bc1qlabeledusedaddress', "m/84'/0'/0'/0/0", '100000');
const UNLABELED_USED = mockAddress('bc1qunlabeledusedaddress', "m/84'/0'/0'/0/1", '200000');
const LABELED_UNUSED = mockAddress('bc1qlabeledunusedaddress', "m/84'/0'/0'/0/2", '0');

const USED_LABEL = 'Salary';
const UNUSED_LABEL = 'Savings';

const btcAccount = {
    key: ACCOUNT_KEY,
    descriptor: ACCOUNT_DESCRIPTOR,
    deviceState: DEVICE_SSID,
    accountType: 'normal',
    visible: true,
    empty: false,
    symbol: 'btc',
    networkType: 'bitcoin',
    formattedBalance: '0.003',
    addresses: {
        used: [LABELED_USED, UNLABELED_USED],
        unused: [LABELED_UNUSED],
        change: [],
    },
} as unknown as Account;

const mockSuiteSyncAddress = (address: string, label: string | null) => ({
    id: createSuiteSyncAddressId(address, 'btc'),
    address,
    label,
    accountDescriptor: ACCOUNT_DESCRIPTOR,
    networkSymbol: 'btc' as const,
});

const buildState = () => ({
    ...mockInitialAppState,
    metadata: initialMetadataState,
    device: {
        ...mockInitialAppState.device,
        selectedDevice: mockSuiteDevice({
            connected: true,
            available: true,
            state: { staticSessionId: DEVICE_SSID },
        }),
    },
    suiteSync: {
        ...mockInitialAppState.suiteSync,
        settings: { ...mockInitialAppState.suiteSync.settings, isSuiteSyncEnabled: true },
    },
    suiteSyncData: {
        wallets: {
            [WALLET_DESCRIPTOR]: {
                wallet: { walletDescriptor: WALLET_DESCRIPTOR, label: null },
                accounts: {},
                addresses: {
                    [LABELED_USED.address]: mockSuiteSyncAddress(LABELED_USED.address, USED_LABEL),
                    [UNLABELED_USED.address]: mockSuiteSyncAddress(UNLABELED_USED.address, null),
                    [LABELED_UNUSED.address]: mockSuiteSyncAddress(
                        LABELED_UNUSED.address,
                        UNUSED_LABEL,
                    ),
                },
                outputs: {},
            },
        },
    },
    wallet: {
        ...mockInitialAppState.wallet,
        accounts: [btcAccount],
        settings: initialWalletSettingsState,
    } as any,
});

const renderModal = () => {
    const store = configureMockStore({ extra: undefined, preloadedState: buildState() });

    return renderWithProviders(
        store,
        { addressValidator: mockAddressValidator() },
        <TradingUtxoReceiveAddressModal />,
    );
};

const search = (value: string) => {
    fireEvent.change(screen.getByTestId(SEARCH_INPUT), { target: { value } });
};

const optionOf = (container: HTMLElement, { address }: Address) =>
    container.querySelector(`[id="${address}"]`)?.closest(`[data-testid="${OPTION}"]`) ?? null;

describe('TradingUtxoReceiveAddressModal', () => {
    beforeEach(() => {
        jest.mocked(useTradingReceiveAddressValues).mockReturnValue({
            cryptoId: 'btc',
            extraFieldDescription: undefined,
            tradingReceiveAddress: {
                selectedAccount: btcAccount,
                form: { setValue: jest.fn() },
                onChangeAccount: jest.fn(),
            },
        } as unknown as ReturnType<typeof useTradingReceiveAddressValues>);
    });

    it('renders the label of a labeled address next to the address itself', () => {
        const { container } = renderModal();

        expect(screen.getAllByTestId(OPTION)).toHaveLength(3);

        expect(optionOf(container, LABELED_USED)).toHaveTextContent(USED_LABEL);
        expect(optionOf(container, LABELED_UNUSED)).toHaveTextContent(UNUSED_LABEL);
    });

    it('renders an unlabeled address without any label', () => {
        const { container } = renderModal();

        expect(screen.getAllByText(new RegExp(`^(${USED_LABEL}|${UNUSED_LABEL})$`))).toHaveLength(
            2,
        );
        expect(optionOf(container, UNLABELED_USED)).not.toHaveTextContent(USED_LABEL);
    });

    it('filters addresses by label, case insensitively', () => {
        const { container } = renderModal();

        search('salary');

        expect(screen.getAllByTestId(OPTION)).toHaveLength(1);
        expect(optionOf(container, LABELED_USED)).toHaveTextContent(USED_LABEL);
    });

    it('still filters addresses by address and by path', () => {
        const { container } = renderModal();

        search(UNLABELED_USED.address);

        expect(screen.getAllByTestId(OPTION)).toHaveLength(1);
        expect(optionOf(container, UNLABELED_USED)).toBeInTheDocument();

        search(LABELED_UNUSED.path);

        expect(screen.getAllByTestId(OPTION)).toHaveLength(1);
        expect(optionOf(container, LABELED_UNUSED)).toHaveTextContent(UNUSED_LABEL);
    });

    it('renders the empty state when nothing matches', () => {
        renderModal();

        search('no-such-address');

        expect(screen.queryAllByTestId(OPTION)).toHaveLength(0);
        expect(
            screen.getByTestId('TR_TRADING_RECEIVE_ADDRESS_NOT_FOUND_TITLE'),
        ).toBeInTheDocument();
    });
});
