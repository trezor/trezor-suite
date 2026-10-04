import '@suite-common/test-utils/globalOverrides';

import { configureStore } from '@reduxjs/toolkit';
import { screen } from '@testing-library/react';

import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type StaticSessionId } from '@trezor/connect';

import { type AppState } from 'src/reducers/store';
import { createEmptyWalletState } from 'src/reducers/suite/contactsReducer';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { RelaySyncStatus } from './RelaySyncStatus';
import { extraDependenciesDesktopMock } from '../../../mocks/extraDependenciesDesktopMock';
import { mockInitialAppState } from '../../../mocks/mockInitialAppState';

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: { id: string }) => <span>{id}</span>,
}));

const WALLET: StaticSessionId = 'wallet@deviceid:0';
const IDENTITY_NPUB = 'a'.repeat(64);

const createStore = ({ identityNpub }: { identityNpub?: string }) => {
    const device = mockSuiteDevice({
        connected: true,
        state: { staticSessionId: WALLET, sessionId: 'session-1' },
    });
    const preloadedState: AppState = {
        ...mockInitialAppState,
        device: { ...mockInitialAppState.device, devices: [device], selectedDevice: device },
        suiteSettings: {
            ...mockInitialAppState.suiteSettings,
            contactsRelayUrls: ['wss://relay.example.com'],
        },
        contacts: {
            byWallet: { [WALLET]: { ...createEmptyWalletState(), identityNpub } },
            deviceAuthority: {},
            relay: { isConnected: false },
        },
    };

    return configureStore({
        reducer: (state: AppState = preloadedState): AppState => state,
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
    });
};

const renderStatus = (identityNpub?: string) =>
    renderWithProviders(
        createStore({ identityNpub }),
        extraDependenciesDesktopMock.services,
        <RelaySyncStatus onClick={jest.fn()} />,
    );

describe('RelaySyncStatus', () => {
    it('reads as not connected while the wallet has no identity, which opens no relay', () => {
        renderStatus();

        expect(screen.getByTestId('@contacts/relay-status')).toHaveTextContent(
            'TR_CONTACTS_RELAY_NOT_CONNECTED',
        );
    });

    it('reads as connecting once the identity is loaded', () => {
        renderStatus(IDENTITY_NPUB);

        expect(screen.getByTestId('@contacts/relay-status')).toHaveTextContent(
            'TR_CONTACTS_RELAY_CONNECTING',
        );
    });
});
