import '@suite-common/test-utils/globalOverrides';

import { type UnknownAction, configureStore, createAction } from '@reduxjs/toolkit';
import { act } from '@testing-library/react';

import { initialMetadataState } from '@suite/metadata';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { transactionsInitialState } from '@suite-common/wallet-core';
import { type Account, type ReceiveInfo } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId } from '@trezor/connect';

import { type AppState } from 'src/reducers/store';
import { createEmptyWalletState } from 'src/reducers/suite/contactsReducer';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { ShareAddressModal } from './ShareAddressModal';
import { extraDependenciesDesktopMock } from '../../../mocks/extraDependenciesDesktopMock';
import { mockInitialAppState } from '../../../mocks/mockInitialAppState';

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: { id: string }) => <span>{id}</span>,
}));

global.ResizeObserver = class MockedResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
};

const WALLET: StaticSessionId = 'wallet@deviceid:0';
const CONTACT_NPUB = 'c'.repeat(64);
const FIRST_ADDRESS = 'bc1qfirstreceiveaddress0000000000000000001';
const SECOND_ADDRESS = 'bc1qsecondreceiveaddress000000000000000002';
const THIRD_ADDRESS = 'bc1qthirdreceiveaddress0000000000000000003';
const TOP_ADDRESS = 'bc1qtopreceiveaddress00000000000000000000004';

const receiveAddress = (address: string, index: number, transfers = 0) => ({
    address,
    path: `m/84'/0'/0'/0/${index}`,
    transfers,
    balance: '0',
    sent: '0',
    received: '0',
});

const mockAccount = ({ isFirstAddressPaid }: { isFirstAddressPaid: boolean }) =>
    mockWalletAccount({
        symbol: 'btc',
        deviceState: WALLET,
        path: "m/84'/0'/0'",
        addresses: {
            change: [],
            used: [],
            unused: [
                receiveAddress(FIRST_ADDRESS, 0, isFirstAddressPaid ? 1 : 0),
                receiveAddress(SECOND_ADDRESS, 1),
                receiveAddress(THIRD_ADDRESS, 2),
                receiveAddress(TOP_ADDRESS, 3),
            ],
        },
    });

// Stands in for a discovery or blockchain update of the account.
const accountReplaced = createAction<Account>('test/accountReplaced');

type CreateStoreParams = {
    touchedAddresses?: ReceiveInfo[];
    currentFreshAddress?: ReceiveInfo;
};

const createStore = ({ touchedAddresses = [], currentFreshAddress }: CreateStoreParams = {}) => {
    const device = mockSuiteDevice({
        connected: true,
        state: { staticSessionId: WALLET, sessionId: 'session-1' },
    });
    const account = mockAccount({ isFirstAddressPaid: false });
    const preloadedState: AppState = {
        ...mockInitialAppState,
        device: { ...mockInitialAppState.device, devices: [device], selectedDevice: device },
        metadata: initialMetadataState,
        wallet: {
            ...mockInitialAppState.wallet,
            accounts: [account],
            transactions: transactionsInitialState,
        },
        receive: { accounts: { [account.key]: { touchedAddresses, currentFreshAddress } } },
        contacts: {
            byWallet: { [WALLET]: createEmptyWalletState() },
            deviceAuthority: {},
            relay: { isConnected: false },
        },
    };

    return configureStore({
        reducer: (state: AppState = preloadedState, action: UnknownAction): AppState =>
            accountReplaced.match(action)
                ? { ...state, wallet: { ...state.wallet, accounts: [action.payload] } }
                : state,
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
    });
};

// The list shows addresses truncated; each row carries the full address as its element id.
const isAddressListed = (address: string) => document.getElementById(address) !== null;

describe('ShareAddressModal', () => {
    it('drops an address that receives a payment while the modal is open', () => {
        const store = createStore();

        renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <ShareAddressModal npub={CONTACT_NPUB} onClose={jest.fn()} />,
        );

        expect(isAddressListed(FIRST_ADDRESS)).toBe(true);

        act(() => {
            store.dispatch(accountReplaced(mockAccount({ isFirstAddressPaid: true })));
        });

        expect(isAddressListed(FIRST_ADDRESS)).toBe(false);
        expect(isAddressListed(SECOND_ADDRESS)).toBe(true);
    });

    it('does not offer an address given out on the Receive page', () => {
        const store = createStore({
            touchedAddresses: [{ path: "m/84'/0'/0'/0/0", address: FIRST_ADDRESS }],
        });

        renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <ShareAddressModal npub={CONTACT_NPUB} onClose={jest.fn()} />,
        );

        expect(isAddressListed(FIRST_ADDRESS)).toBe(false);
        expect(isAddressListed(SECOND_ADDRESS)).toBe(true);
    });

    it('does not offer the address the Receive page shows, nor the ones below it', () => {
        const store = createStore({
            currentFreshAddress: { path: "m/84'/0'/0'/0/1", address: SECOND_ADDRESS },
        });

        renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <ShareAddressModal npub={CONTACT_NPUB} onClose={jest.fn()} />,
        );

        expect(isAddressListed(FIRST_ADDRESS)).toBe(false);
        expect(isAddressListed(SECOND_ADDRESS)).toBe(false);
        expect(isAddressListed(THIRD_ADDRESS)).toBe(true);
    });

    it('keeps the highest unused address for the Receive page', () => {
        const store = createStore();

        renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <ShareAddressModal npub={CONTACT_NPUB} onClose={jest.fn()} />,
        );

        expect(isAddressListed(SECOND_ADDRESS)).toBe(true);
        expect(isAddressListed(TOP_ADDRESS)).toBe(false);
    });
});
