import { schnorr } from '@noble/curves/secp256k1.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import {
    type Middleware,
    type UnknownAction,
    configureStore,
    createAction,
} from '@reduxjs/toolkit';

import { debugInitialState } from '@suite/debug';
import { initialMetadataState } from '@suite/metadata';
import {
    prepareSuiteSettingsReducer,
    suiteSettingsActions,
    suiteSettingsInitialState,
} from '@suite/settings';
import { type DeviceRootState, deviceInitialState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import {
    type ReceiveState,
    prepareReceiveReducer,
    receiveInitialState,
} from '@suite-common/receive';
import { initialSuiteSyncDataState, initialSuiteSyncState } from '@suite-common/suite-sync';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { transactionsInitialState } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect, { type StaticSessionId } from '@trezor/connect';
import { type Result, err, ok } from '@trezor/type-utils';

import {
    type WardFlushResult,
    type WardFlushThunkParams,
    type WardQueueEntryThunkParams,
} from 'src/actions/suite/wardThunks';
import {
    type ContactsFeatureRootState,
    type ContactsRootState,
    type ContactsWalletState,
    type DeviceAuthorityState,
    MAX_PENDING_REQUEST_EVENT_IDS,
    MAX_UNSPENT_CONTACT_ADDRESSES,
    contactsActions,
    contactsReducer,
    createEmptyWalletState,
    isLocallyAnchored,
    selectDeviceAuthority,
} from 'src/reducers/suite/contactsReducer';
import { syncDesktopRelayAllowlist } from 'src/services/nostr/desktopRelayAllowlist';
import {
    KIND_ADDRESS_REPLY,
    KIND_ADDRESS_REQUEST,
    type NostrEvent,
} from 'src/services/nostr/relayClient';
import {
    disposeAllRelayPools,
    disposeRelayPoolsExcept,
    publishDraftToPool,
    queryRelaysOnce,
    reconcileRelayPool,
} from 'src/services/nostr/relayPool';
import {
    ATTESTATION_KIND,
    type Attestation,
    attestationEventId,
    decodeAttestation,
    encodeAttestation,
} from 'src/utils/contacts/attestation';
import { type WardError } from 'src/utils/suite/wardErrors';

import {
    type AddContactThunkDeps,
    type ShareFreshAddressWithContactThunkState,
    addContactThunk,
    addLocalContactThunk,
    ensureContactSyncThunk,
    fetchContactBacklogThunk,
    getFreshContactAddressThunk,
    handleRelayEventThunk,
    loadIdentityThunk,
    removeContactThunk,
    renameContactThunk,
    requestAddressFromContactThunk,
    shareFreshAddressWithContactThunk,
    verifyContactThunk,
} from './contactsThunks';

const mockWardQueueEntry = jest.fn<Promise<Result<void, WardError>>, [WardQueueEntryThunkParams]>();
const mockWardFlush = jest.fn<
    Promise<Result<WardFlushResult, WardError>>,
    [WardFlushThunkParams | undefined]
>();

// The WARD thunks have their own tests; here they only report what the device and wardd did.
jest.mock('src/actions/suite/wardThunks', () => ({
    wardQueueEntryThunk: (params: WardQueueEntryThunkParams) => () => ({
        unwrap: () => mockWardQueueEntry(params),
    }),
    wardFlushThunk: (params: WardFlushThunkParams | undefined) => () => ({
        unwrap: () => mockWardFlush(params),
    }),
}));
jest.mock('src/services/nostr/relayPool');
jest.mock('src/services/nostr/desktopRelayAllowlist');

const mockPublishDraftToPool = jest.mocked(publishDraftToPool);
const mockQueryRelaysOnce = jest.mocked(queryRelaysOnce);
const mockReconcileRelayPool = jest.mocked(reconcileRelayPool);
const mockDisposeAllRelayPools = jest.mocked(disposeAllRelayPools);
const mockDisposeRelayPoolsExcept = jest.mocked(disposeRelayPoolsExcept);
const mockSyncDesktopRelayAllowlist = jest.mocked(syncDesktopRelayAllowlist);
const mockNostrGetPublicKey = jest.mocked(TrezorConnect.nostrGetPublicKey);
const mockNostrSignEvent = jest.mocked(TrezorConnect.nostrSignEvent);
// jest types an overloaded method by its last overload, the bundle form; the thunks call the
// single-address form.
const mockGetAddress = TrezorConnect.getAddress as jest.Mock;

const WALLET_A: StaticSessionId = 'walletA@deviceid:0';
// A passphrase wallet of the same device.
const WALLET_B: StaticSessionId = 'walletB@deviceid:1';
// Standard wallets of two other devices, one remembered and one not.
const WALLET_REMEMBERED: StaticSessionId = 'walletC@rememberedid:0';
const WALLET_NOT_REMEMBERED: StaticSessionId = 'walletD@otherid:0';
const RELAY_URL = 'wss://relay.example.com';
const SLIP44_BTC = 0;
const SLIP44_TESTNET = 1;
const CREATED_AT = 1_700_000_000;

const OWN_SECRET = hexToBytes('11'.repeat(32));
const OWN_NPUB = bytesToHex(schnorr.getPublicKey(OWN_SECRET));
const CONTACT_SECRET = hexToBytes('22'.repeat(32));
const CONTACT_NPUB = bytesToHex(schnorr.getPublicKey(CONTACT_SECRET));
const NEW_NPUB = 'd'.repeat(64);

const ADDRESS_1 = 'bc1qcontactaddress000000000000000000000001';
const ADDRESS_2 = 'bc1qcontactaddress000000000000000000000002';
const MY_ADDRESS = 'bc1qmyreceiveaddress00000000000000000000001';
const MY_ADDRESS_2 = 'bc1qmyreceiveaddress00000000000000000000002';
// The highest unused address, which is never shared: the Receive page falls back to it.
const MY_ADDRESS_TOP = 'bc1qmyreceiveaddress00000000000000000000003';

// Signed the way a peer's device signs: the contact's identity key over the NIP-01 event id.
const signedAttestation = ({
    secret = CONTACT_SECRET,
    address,
    slip44 = SLIP44_BTC,
    createdAt = CREATED_AT,
}: {
    secret?: Uint8Array;
    address: string;
    slip44?: number;
    createdAt?: number;
}): Attestation => {
    const npub = bytesToHex(schnorr.getPublicKey(secret));
    const eventId = attestationEventId({ npub, slip44, address, createdAt });

    return {
        npub,
        address,
        slip44,
        createdAt,
        kind: ATTESTATION_KIND,
        signature: bytesToHex(schnorr.sign(hexToBytes(eventId), secret)),
        eventId,
    };
};

type DeviceSignParams = { created_at: number; kind: number; content: string };

// What NostrSignEvent returns: the firmware serializes the event per NIP-01 and signs its id.
const signEventLikeDevice = (
    { created_at, kind, content }: DeviceSignParams,
    secret: Uint8Array,
) => {
    const pubkey = bytesToHex(schnorr.getPublicKey(secret));
    const serialized = JSON.stringify([0, pubkey, created_at, kind, [], content]);
    const id = bytesToHex(sha256(new TextEncoder().encode(serialized)));

    return { pubkey, id, signature: bytesToHex(schnorr.sign(hexToBytes(id), secret)) };
};

const relayEvent = (event: Pick<NostrEvent, 'id' | 'kind' | 'content'>): NostrEvent => ({
    // The envelope key is ephemeral and carries no trust.
    pubkey: 'f'.repeat(64),
    created_at: CREATED_AT,
    tags: [],
    sig: 's'.repeat(128),
    ...event,
});

const addressRequestEvent = (id: string, content = `${SLIP44_BTC}:${CONTACT_NPUB}`) =>
    relayEvent({ id, kind: KIND_ADDRESS_REQUEST, content });

const mockWallet = (staticSessionId: StaticSessionId) =>
    mockSuiteDevice({
        path: '1',
        connected: true,
        remember: staticSessionId !== WALLET_NOT_REMEMBERED,
        instance: staticSessionId === WALLET_B ? 1 : undefined,
        useEmptyPassphrase: staticSessionId !== WALLET_B,
        state: { staticSessionId, sessionId: 'session-1' },
    });

const anchoredAuthority = (npub: string, label = 'Carol'): DeviceAuthorityState => ({
    anchoredNpubs: { [npub]: { label, anchoredAt: 1 } },
});

const walletWithContact = (overrides: Partial<ContactsWalletState> = {}): ContactsWalletState => ({
    ...createEmptyWalletState(),
    identityNpub: OWN_NPUB,
    contacts: {
        [CONTACT_NPUB]: { npub: CONTACT_NPUB, label: 'Carol', addedAt: 1, isVerified: true },
    },
    ...overrides,
});

type TestState = ContactsRootState &
    DeviceRootState &
    ContactsFeatureRootState &
    ShareFreshAddressWithContactThunkState;

type CreateTestStateParams = {
    wallet?: ContactsWalletState;
    authority?: DeviceAuthorityState;
    isFeatureEnabled?: boolean;
    relayUrls?: string[];
    accounts?: Account[];
    receive?: ReceiveState;
};

const createTestState = ({
    wallet = walletWithContact(),
    authority,
    isFeatureEnabled = true,
    relayUrls = [RELAY_URL],
    accounts = [],
    receive = receiveInitialState,
}: CreateTestStateParams = {}): TestState => {
    const devices = [WALLET_A, WALLET_B, WALLET_REMEMBERED, WALLET_NOT_REMEMBERED].map(mockWallet);

    return {
        contacts: {
            byWallet: { [WALLET_A]: wallet },
            deviceAuthority: authority ? { [WALLET_A]: authority } : {},
            relay: { isConnected: false },
        },
        device: { ...deviceInitialState, devices, selectedDevice: devices[0] },
        suiteSettings: {
            ...suiteSettingsInitialState,
            experimental: isFeatureEnabled ? ['contacts'] : [],
            contactsRelayUrls: relayUrls,
        },
        debug: { ...debugInitialState, showDebugMenu: true },
        wallet: { accounts, transactions: transactionsInitialState },
        receive,
        metadata: initialMetadataState,
        suite: { online: true },
        suiteSync: initialSuiteSyncState,
        suiteSyncData: initialSuiteSyncDataState,
        messageSystem: messageSystemInitialState,
    };
};

const walletSelected = createAction<StaticSessionId>('test/walletSelected');
// Stands in for a discovery or blockchain update of the account.
const accountReplaced = createAction<Account>('test/accountReplaced');

const suiteSettingsReducer = prepareSuiteSettingsReducer(extraDependenciesCommonMock);
const receiveReducer = prepareReceiveReducer(extraDependenciesCommonMock);

// The WARD thunks are mocked, so the delegated identity key is never asked for.
const extra: AddContactThunkDeps = { services: { ensureDelegatedIdentityKey: jest.fn() } };

const createTestStore = (params?: CreateTestStateParams) => {
    const initialState = createTestState(params);
    const actions: UnknownAction[] = [];
    const recordActions: Middleware = () => next => action => {
        actions.push(action as UnknownAction);

        return next(action);
    };
    const store = configureStore({
        reducer: (state: TestState = initialState, action: UnknownAction): TestState => {
            if (walletSelected.match(action)) {
                return {
                    ...state,
                    device: {
                        ...state.device,
                        selectedDevice: state.device.devices.find(
                            device => device.state?.staticSessionId === action.payload,
                        ),
                    },
                };
            }

            if (accountReplaced.match(action)) {
                return {
                    ...state,
                    wallet: {
                        ...state.wallet,
                        accounts: state.wallet.accounts.map(account =>
                            account.key === action.payload.key ? action.payload : account,
                        ),
                    },
                };
            }

            return {
                ...state,
                contacts: contactsReducer(state.contacts, action),
                suiteSettings: suiteSettingsReducer(state.suiteSettings, action),
                receive: receiveReducer(state.receive, action),
            };
        },
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                thunk: { extraArgument: extra },
                serializableCheck: false,
                immutableCheck: false,
            }).concat(recordActions),
    });

    // Storage persists every contacts slice action except the relay status, so these are the
    // IndexedDB writes. Thunk lifecycle actions share the prefix but carry `meta`.
    const getPersistedActions = () =>
        actions.filter(
            action =>
                action.type.startsWith('@suite/contacts/') &&
                !('meta' in action) &&
                !contactsActions.relayStatusUpdated.match(action),
        );

    return { store, actions, getPersistedActions };
};

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('contactsThunks', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockQueryRelaysOnce.mockResolvedValue([]);
        mockSyncDesktopRelayAllowlist.mockResolvedValue();
        mockWardQueueEntry.mockResolvedValue(ok());
        mockWardFlush.mockResolvedValue(ok({ published: 1, remaining: 0 }));
    });

    describe('handleRelayEventThunk: address requests', () => {
        // Turning the feature off forgets which attestation was served when.
        beforeEach(async () => {
            const { store } = createTestStore({ isFeatureEnabled: false });
            await store.dispatch(ensureContactSyncThunk());
            jest.clearAllMocks();
        });

        it('records a request it cannot serve once and ignores its replay', async () => {
            const { store, getPersistedActions } = createTestStore();
            const event = addressRequestEvent('a'.repeat(64));

            await store.dispatch(handleRelayEventThunk({ event, deviceState: WALLET_A }));

            expect(
                getPersistedActions().filter(contactsActions.addressRequestReceived.match),
            ).toHaveLength(1);
            expect(mockPublishDraftToPool).not.toHaveBeenCalled();

            const actionCount = getPersistedActions().length;
            await store.dispatch(handleRelayEventThunk({ event, deviceState: WALLET_A }));

            expect(getPersistedActions()).toHaveLength(actionCount);
        });

        it('records a request again once its inbox entry was cleared', async () => {
            const { store, getPersistedActions } = createTestStore();
            const event = addressRequestEvent('b'.repeat(64));

            await store.dispatch(handleRelayEventThunk({ event, deviceState: WALLET_A }));
            store.dispatch(
                contactsActions.addressRequestCleared({
                    deviceState: WALLET_A,
                    npub: CONTACT_NPUB,
                    slip44: SLIP44_BTC,
                }),
            );
            await store.dispatch(handleRelayEventThunk({ event, deviceState: WALLET_A }));

            expect(
                getPersistedActions().filter(contactsActions.addressRequestReceived.match),
            ).toHaveLength(2);
        });

        it('does not bring back a dismissed request when the relay replays it', async () => {
            const { store, getPersistedActions } = createTestStore();
            const event = addressRequestEvent('c'.repeat(64));

            await store.dispatch(handleRelayEventThunk({ event, deviceState: WALLET_A }));
            store.dispatch(
                contactsActions.addressRequestDismissed({
                    deviceState: WALLET_A,
                    npub: CONTACT_NPUB,
                    slip44: SLIP44_BTC,
                }),
            );
            const actionCount = getPersistedActions().length;
            await store.dispatch(handleRelayEventThunk({ event, deviceState: WALLET_A }));

            expect(getPersistedActions()).toHaveLength(actionCount);
            expect(store.getState().contacts.byWallet[WALLET_A]?.pendingRequests).toEqual({});
        });

        it('records a retry under a new event id, so a dismissal covers its replay too', async () => {
            const { store, getPersistedActions } = createTestStore();
            const first = addressRequestEvent('d'.repeat(64));
            const retry = addressRequestEvent('e'.repeat(64));

            await store.dispatch(handleRelayEventThunk({ event: first, deviceState: WALLET_A }));
            await store.dispatch(handleRelayEventThunk({ event: retry, deviceState: WALLET_A }));

            expect(
                getPersistedActions().filter(contactsActions.addressRequestReceived.match),
            ).toHaveLength(2);

            store.dispatch(
                contactsActions.addressRequestDismissed({
                    deviceState: WALLET_A,
                    npub: CONTACT_NPUB,
                    slip44: SLIP44_BTC,
                }),
            );
            const actionCount = getPersistedActions().length;
            await store.dispatch(handleRelayEventThunk({ event: retry, deviceState: WALLET_A }));

            expect(getPersistedActions()).toHaveLength(actionCount);
        });

        it('serves a contact from an address already attested for them, once', async () => {
            const myAttestation = signedAttestation({ secret: OWN_SECRET, address: MY_ADDRESS });
            const { store } = createTestStore({
                wallet: walletWithContact({
                    sharedAddresses: {
                        [MY_ADDRESS]: {
                            npub: CONTACT_NPUB,
                            attestation: myAttestation,
                            sharedAt: 1,
                        },
                    },
                }),
            });
            const event = addressRequestEvent('f'.repeat(64));

            await store.dispatch(handleRelayEventThunk({ event, deviceState: WALLET_A }));
            await store.dispatch(handleRelayEventThunk({ event, deviceState: WALLET_A }));

            expect(mockPublishDraftToPool).toHaveBeenCalledTimes(1);
            expect(mockPublishDraftToPool).toHaveBeenCalledWith(WALLET_A, {
                kind: KIND_ADDRESS_REPLY,
                tags: [['p', CONTACT_NPUB]],
                content: encodeAttestation(myAttestation),
            });

            const wallet = store.getState().contacts.byWallet[WALLET_A];
            expect(wallet?.servedRequestIds).toEqual([event.id]);
            expect(wallet?.pendingRequests).toEqual({});
        });

        it('ignores a request for a coin outside the exchange and one from a stranger', async () => {
            const { store, getPersistedActions } = createTestStore();

            await store.dispatch(
                handleRelayEventThunk({
                    event: addressRequestEvent('1'.repeat(64), `2:${CONTACT_NPUB}`),
                    deviceState: WALLET_A,
                }),
            );
            await store.dispatch(
                handleRelayEventThunk({
                    event: addressRequestEvent('2'.repeat(64), `${SLIP44_BTC}:${NEW_NPUB}`),
                    deviceState: WALLET_A,
                }),
            );

            expect(getPersistedActions()).toEqual([]);
            expect(mockPublishDraftToPool).not.toHaveBeenCalled();
        });

        it('serves forged copies of a request under new ids once per window', async () => {
            const myAttestation = signedAttestation({ secret: OWN_SECRET, address: MY_ADDRESS });
            const { store, getPersistedActions } = createTestStore({
                wallet: walletWithContact({
                    sharedAddresses: {
                        [MY_ADDRESS]: {
                            npub: CONTACT_NPUB,
                            attestation: myAttestation,
                            sharedAt: 1,
                        },
                    },
                }),
            });

            for (let index = 0; index < 100; index++) {
                await store.dispatch(
                    handleRelayEventThunk({
                        event: addressRequestEvent(index.toString(16).padStart(64, '0')),
                        deviceState: WALLET_A,
                    }),
                );
            }

            expect(mockPublishDraftToPool).toHaveBeenCalledTimes(1);
            expect(getPersistedActions()).toHaveLength(1);
        });

        it('stops recording forged retries once the inbox row is full', async () => {
            const { store, getPersistedActions } = createTestStore();

            for (let index = 0; index < MAX_PENDING_REQUEST_EVENT_IDS + 36; index++) {
                await store.dispatch(
                    handleRelayEventThunk({
                        event: addressRequestEvent(index.toString(16).padStart(64, '0')),
                        deviceState: WALLET_A,
                    }),
                );
            }

            expect(getPersistedActions()).toHaveLength(MAX_PENDING_REQUEST_EVENT_IDS);
            expect(
                store.getState().contacts.byWallet[WALLET_A]?.pendingRequests[
                    `${CONTACT_NPUB}:${SLIP44_BTC}`
                ]?.eventIds,
            ).toHaveLength(MAX_PENDING_REQUEST_EVENT_IDS);
        });
    });

    describe('handleRelayEventThunk: address replies', () => {
        const replyEvent = (attestation: Attestation) =>
            relayEvent({
                id: attestation.eventId,
                kind: KIND_ADDRESS_REPLY,
                content: encodeAttestation(attestation),
            });

        it('stores an address from an anchored contact once', async () => {
            const { store, getPersistedActions } = createTestStore({
                authority: anchoredAuthority(CONTACT_NPUB),
            });
            const attestation = signedAttestation({ address: ADDRESS_1 });

            await store.dispatch(
                handleRelayEventThunk({ event: replyEvent(attestation), deviceState: WALLET_A }),
            );
            await store.dispatch(
                handleRelayEventThunk({ event: replyEvent(attestation), deviceState: WALLET_A }),
            );

            expect(
                getPersistedActions().filter(contactsActions.addressVerified.match),
            ).toHaveLength(1);
            expect(store.getState().contacts.byWallet[WALLET_A]?.verifiedAddresses).toEqual({
                [ADDRESS_1]: attestation,
            });
        });

        it("stores and persists no more of a contact's unpaid addresses than the cap", async () => {
            const { store, getPersistedActions } = createTestStore({
                authority: anchoredAuthority(CONTACT_NPUB),
            });
            const flood = Array.from({ length: MAX_UNSPENT_CONTACT_ADDRESSES + 5 }, (_, index) =>
                signedAttestation({ address: `bc1qflood${index}` }),
            );

            for (const attestation of flood) {
                await store.dispatch(
                    handleRelayEventThunk({
                        event: replyEvent(attestation),
                        deviceState: WALLET_A,
                    }),
                );
            }

            expect(
                Object.keys(store.getState().contacts.byWallet[WALLET_A]?.verifiedAddresses ?? {}),
            ).toHaveLength(MAX_UNSPENT_CONTACT_ADDRESSES);
            expect(getPersistedActions()).toHaveLength(MAX_UNSPENT_CONTACT_ADDRESSES);
        });

        it('stores a re-signed copy of a stored address only when it is newer', async () => {
            const { store, getPersistedActions } = createTestStore({
                authority: anchoredAuthority(CONTACT_NPUB),
            });
            const stored = signedAttestation({ address: ADDRESS_1 });
            const older = signedAttestation({ address: ADDRESS_1, createdAt: CREATED_AT - 1 });
            const newer = signedAttestation({ address: ADDRESS_1, createdAt: CREATED_AT + 1 });

            for (const attestation of [stored, older, stored, newer]) {
                await store.dispatch(
                    handleRelayEventThunk({
                        event: replyEvent(attestation),
                        deviceState: WALLET_A,
                    }),
                );
            }

            expect(
                getPersistedActions()
                    .filter(contactsActions.addressVerified.match)
                    .map(action => action.payload.attestation),
            ).toEqual([stored, newer]);
        });

        // Regression: a stored address re-signed for the other coin type skipped the cap and moved
        // to that coin's count, so a contact could grow its addresses without end.
        it('drops a stored address re-signed for another coin, which would take it past the cap', async () => {
            const { store, getPersistedActions } = createTestStore({
                authority: anchoredAuthority(CONTACT_NPUB),
            });
            const testnetAddresses = Array.from(
                { length: MAX_UNSPENT_CONTACT_ADDRESSES },
                (_, index) =>
                    signedAttestation({ address: `tb1qflood${index}`, slip44: SLIP44_TESTNET }),
            );
            const mainnet = signedAttestation({ address: ADDRESS_1 });
            const resigned = signedAttestation({
                address: ADDRESS_1,
                slip44: SLIP44_TESTNET,
                createdAt: CREATED_AT + 1,
            });

            for (const attestation of [...testnetAddresses, mainnet]) {
                await store.dispatch(
                    handleRelayEventThunk({
                        event: replyEvent(attestation),
                        deviceState: WALLET_A,
                    }),
                );
            }
            const persistedCount = getPersistedActions().length;
            await store.dispatch(
                handleRelayEventThunk({ event: replyEvent(resigned), deviceState: WALLET_A }),
            );

            expect(getPersistedActions()).toHaveLength(persistedCount);
            expect(
                store.getState().contacts.byWallet[WALLET_A]?.verifiedAddresses[ADDRESS_1],
            ).toEqual(mainnet);
        });

        it('drops an address from a contact that is not anchored on this device', async () => {
            const { store, getPersistedActions } = createTestStore();
            const attestation = signedAttestation({ address: ADDRESS_1 });

            await store.dispatch(
                handleRelayEventThunk({ event: replyEvent(attestation), deviceState: WALLET_A }),
            );

            expect(getPersistedActions()).toEqual([]);
        });
    });

    describe('addContactThunk and verifyContactThunk', () => {
        it('queues the name in WARD, anchors the contact, then flushes', async () => {
            const { store, actions } = createTestStore({
                wallet: walletWithContact({
                    contacts: {
                        [CONTACT_NPUB]: {
                            npub: CONTACT_NPUB,
                            label: 'Carol',
                            addedAt: 5,
                            isVerified: false,
                        },
                    },
                }),
            });

            const result = await store
                .dispatch(verifyContactThunk({ npub: CONTACT_NPUB }))
                .unwrap();

            expect(result).toEqual(ok({}));
            expect(mockWardQueueEntry).toHaveBeenCalledWith({
                deviceState: WALLET_A,
                appId: 'contacts',
                identifier: CONTACT_NPUB,
                // UTF-8 of "Carol".
                value: '4361726f6c',
            });
            expect(mockWardFlush).toHaveBeenCalledWith({ deviceState: WALLET_A });

            // The contact is stored before its anchor, which storage would otherwise drop.
            const upsertIndex = actions.findIndex(contactsActions.contactUpserted.match);
            const anchorIndex = actions.findIndex(contactsActions.contactAnchored.match);
            expect(upsertIndex).toBeGreaterThan(-1);
            expect(upsertIndex).toBeLessThan(anchorIndex);

            const state = store.getState();
            expect(state.contacts.byWallet[WALLET_A]?.contacts[CONTACT_NPUB]).toEqual({
                npub: CONTACT_NPUB,
                label: 'Carol',
                addedAt: 5,
                isVerified: true,
            });
            expect(isLocallyAnchored(selectDeviceAuthority(state, WALLET_A), CONTACT_NPUB)).toBe(
                true,
            );

            // A newly anchored contact may have replied before; its backlog is read again.
            await flushPromises();
            expect(mockQueryRelaysOnce).toHaveBeenCalledWith(
                [RELAY_URL],
                [{ '#p': [OWN_NPUB], kinds: [KIND_ADDRESS_REPLY] }],
            );
        });

        it('records nothing when the device write fails', async () => {
            mockWardQueueEntry.mockResolvedValueOnce(err({ code: 'wallet_changed' }));
            const { store, getPersistedActions } = createTestStore();

            const result = await store
                .dispatch(addContactThunk({ npub: NEW_NPUB, label: 'Bob' }))
                .unwrap();

            expect(result).toEqual(err({ code: 'wallet_changed' }));
            expect(getPersistedActions()).toEqual([]);
            expect(mockWardFlush).not.toHaveBeenCalled();
        });

        it('keeps the anchor and reports the error when wardd does not publish', async () => {
            mockWardFlush.mockResolvedValueOnce(err({ code: 'unreachable' }));
            const { store } = createTestStore();

            const result = await store
                .dispatch(addContactThunk({ npub: NEW_NPUB, label: 'Bob' }))
                .unwrap();

            expect(result).toEqual(ok({ flushError: { code: 'unreachable' } }));
            expect(
                isLocallyAnchored(selectDeviceAuthority(store.getState(), WALLET_A), NEW_NPUB),
            ).toBe(true);
        });

        it('anchors a write confirmed during a wallet switch for the wallet it was made for', async () => {
            const { store } = createTestStore();
            mockWardQueueEntry.mockImplementationOnce(() => {
                store.dispatch(walletSelected(WALLET_B));

                return Promise.resolve(ok());
            });
            mockWardFlush.mockResolvedValueOnce(err({ code: 'wallet_changed' }));

            const result = await store
                .dispatch(addContactThunk({ npub: NEW_NPUB, label: 'Bob' }))
                .unwrap();

            expect(result).toEqual(ok({ flushError: { code: 'wallet_changed' } }));
            expect(mockWardFlush).toHaveBeenCalledWith({ deviceState: WALLET_A });
            expect(
                isLocallyAnchored(selectDeviceAuthority(store.getState(), WALLET_A), NEW_NPUB),
            ).toBe(true);
            expect(store.getState().contacts.byWallet[WALLET_B]).toBeUndefined();
        });

        it('refuses my own identity and an invalid name without the device', async () => {
            const { store } = createTestStore();

            await expect(
                store.dispatch(addContactThunk({ npub: OWN_NPUB, label: 'Me' })).unwrap(),
            ).resolves.toEqual(err({ code: 'own_identity' }));
            await expect(
                store.dispatch(addContactThunk({ npub: NEW_NPUB, label: 'x'.repeat(33) })).unwrap(),
            ).resolves.toEqual(err({ code: 'invalid_label' }));
            expect(mockWardQueueEntry).not.toHaveBeenCalled();
        });
    });

    describe('renameContactThunk', () => {
        it('renames a local contact without the device', async () => {
            const { store } = createTestStore({
                wallet: walletWithContact({
                    contacts: {
                        [CONTACT_NPUB]: {
                            npub: CONTACT_NPUB,
                            label: 'Carol',
                            addedAt: 1,
                            isVerified: false,
                        },
                    },
                }),
            });

            const result = await store
                .dispatch(renameContactThunk({ npub: CONTACT_NPUB, label: ' Caroline ' }))
                .unwrap();

            expect(result).toEqual(ok({}));
            expect(mockWardQueueEntry).not.toHaveBeenCalled();
            expect(
                store.getState().contacts.byWallet[WALLET_A]?.contacts[CONTACT_NPUB]?.label,
            ).toBe('Caroline');
        });

        it('writes the new name of an anchored contact to WARD through the device', async () => {
            const { store } = createTestStore({ authority: anchoredAuthority(CONTACT_NPUB) });

            await store.dispatch(renameContactThunk({ npub: CONTACT_NPUB, label: 'Caroline' }));

            expect(mockWardQueueEntry).toHaveBeenCalledWith(
                expect.objectContaining({ identifier: CONTACT_NPUB, value: '4361726f6c696e65' }),
            );
            expect(
                selectDeviceAuthority(store.getState(), WALLET_A).anchoredNpubs[CONTACT_NPUB]
                    ?.label,
            ).toBe('Caroline');
            // Already anchored, so no backlog was dropped because of it.
            expect(mockQueryRelaysOnce).not.toHaveBeenCalled();
        });
    });

    describe('removeContactThunk', () => {
        it('drops the contact and its anchor without the device', async () => {
            const { store } = createTestStore({ authority: anchoredAuthority(CONTACT_NPUB) });

            const result = await store
                .dispatch(removeContactThunk({ npub: CONTACT_NPUB }))
                .unwrap();

            expect(result).toEqual(ok());
            expect(mockWardQueueEntry).not.toHaveBeenCalled();
            expect(mockWardFlush).not.toHaveBeenCalled();
            expect(
                store.getState().contacts.byWallet[WALLET_A]?.contacts[CONTACT_NPUB],
            ).toBeUndefined();
            expect(
                isLocallyAnchored(selectDeviceAuthority(store.getState(), WALLET_A), CONTACT_NPUB),
            ).toBe(false);
        });
    });

    describe('addLocalContactThunk', () => {
        it('adds an unverified contact', async () => {
            const { store } = createTestStore();

            const result = await store
                .dispatch(addLocalContactThunk({ npub: NEW_NPUB, label: 'Bob' }))
                .unwrap();

            expect(result).toEqual(ok());
            expect(store.getState().contacts.byWallet[WALLET_A]?.contacts[NEW_NPUB]).toEqual({
                npub: NEW_NPUB,
                label: 'Bob',
                addedAt: expect.any(Number),
                isVerified: false,
            });
        });

        it('refuses my own identity and a contact already in the list', async () => {
            const { store } = createTestStore();

            await expect(
                store.dispatch(addLocalContactThunk({ npub: OWN_NPUB, label: 'Me' })).unwrap(),
            ).resolves.toEqual(err({ code: 'own_identity' }));
            await expect(
                store
                    .dispatch(addLocalContactThunk({ npub: CONTACT_NPUB, label: 'Carol' }))
                    .unwrap(),
            ).resolves.toEqual(err({ code: 'duplicate_contact' }));
        });
    });

    describe('getFreshContactAddressThunk', () => {
        const createStoreWithAddresses = () =>
            createTestStore({
                wallet: walletWithContact({
                    verifiedAddresses: {
                        [ADDRESS_1]: signedAttestation({ address: ADDRESS_1 }),
                        [ADDRESS_2]: signedAttestation({
                            address: ADDRESS_2,
                            createdAt: CREATED_AT + 1,
                        }),
                    },
                }),
                authority: anchoredAuthority(CONTACT_NPUB),
            });

        it('hands out another address for a second output to the same contact', async () => {
            const { store } = createStoreWithAddresses();

            const first = await store
                .dispatch(getFreshContactAddressThunk({ npub: CONTACT_NPUB, slip44: SLIP44_BTC }))
                .unwrap();
            const second = await store
                .dispatch(
                    getFreshContactAddressThunk({
                        npub: CONTACT_NPUB,
                        slip44: SLIP44_BTC,
                        exclude: [ADDRESS_1],
                    }),
                )
                .unwrap();

            expect(first).toEqual({ address: ADDRESS_1, label: 'Carol' });
            expect(second).toEqual({ address: ADDRESS_2, label: 'Carol' });
        });

        it('hands out nothing when every address is already in the form', async () => {
            const { store } = createStoreWithAddresses();

            const result = await store
                .dispatch(
                    getFreshContactAddressThunk({
                        npub: CONTACT_NPUB,
                        slip44: SLIP44_BTC,
                        exclude: [ADDRESS_1, ADDRESS_2],
                    }),
                )
                .unwrap();

            expect(result).toBeUndefined();
        });
    });

    describe('fetchContactBacklogThunk', () => {
        it('stores an address reply that the live pool had dropped', async () => {
            const attestation = signedAttestation({ address: ADDRESS_1 });
            mockQueryRelaysOnce.mockResolvedValueOnce([
                relayEvent({
                    id: attestation.eventId,
                    kind: KIND_ADDRESS_REPLY,
                    content: encodeAttestation(attestation),
                }),
            ]);
            const { store } = createTestStore({ authority: anchoredAuthority(CONTACT_NPUB) });

            await store.dispatch(fetchContactBacklogThunk({ deviceState: WALLET_A }));

            expect(
                store.getState().contacts.byWallet[WALLET_A]?.verifiedAddresses[ADDRESS_1],
            ).toEqual(attestation);
        });

        it('does not reach the relays without an identity or with the feature off', async () => {
            const { store } = createTestStore();
            const { store: disabledStore } = createTestStore({ isFeatureEnabled: false });

            await store.dispatch(fetchContactBacklogThunk({ deviceState: WALLET_B }));
            await disabledStore.dispatch(fetchContactBacklogThunk({ deviceState: WALLET_A }));

            expect(mockQueryRelaysOnce).not.toHaveBeenCalled();
        });

        it.each([
            ['the feature is turned off', suiteSettingsActions.setExperimentalFeatures([])],
            [
                'the relays change',
                suiteSettingsActions.setContactsRelayUrls(['wss://other.example.com']),
            ],
        ])('drops what the query returned when %s during it', async (_, action) => {
            const attestation = signedAttestation({ address: ADDRESS_1 });
            const { store, getPersistedActions } = createTestStore({
                authority: anchoredAuthority(CONTACT_NPUB),
            });
            mockQueryRelaysOnce.mockImplementationOnce(() => {
                store.dispatch(action);

                return Promise.resolve([
                    relayEvent({
                        id: attestation.eventId,
                        kind: KIND_ADDRESS_REPLY,
                        content: encodeAttestation(attestation),
                    }),
                ]);
            });

            await store.dispatch(fetchContactBacklogThunk({ deviceState: WALLET_A }));

            expect(getPersistedActions()).toEqual([]);
        });
    });

    describe('loadIdentityThunk', () => {
        it('stores the identity the device returns', async () => {
            mockNostrGetPublicKey.mockResolvedValueOnce({
                success: true,
                payload: { pubkey: OWN_NPUB },
            });
            const { store } = createTestStore({ wallet: createEmptyWalletState() });

            const result = await store.dispatch(loadIdentityThunk()).unwrap();

            expect(result).toEqual(ok(OWN_NPUB));
            expect(mockNostrGetPublicKey).toHaveBeenCalledWith(
                expect.objectContaining({ __experimental: true, path: "m/44'/1237'/0'/0/0" }),
            );
            expect(store.getState().contacts.byWallet[WALLET_A]?.identityNpub).toBe(OWN_NPUB);
        });

        it('reports firmware without Nostr', async () => {
            mockNostrGetPublicKey.mockResolvedValueOnce({
                success: false,
                error: { code: 'Device_FwException', message: 'ui-device_firmware_unsupported' },
            });
            const { store } = createTestStore();

            const result = await store.dispatch(loadIdentityThunk()).unwrap();

            expect(result).toEqual(
                err({ code: 'firmware_unsupported', detail: 'ui-device_firmware_unsupported' }),
            );
        });

        it('records nothing when another wallet is selected while the device answers', async () => {
            const { store, getPersistedActions } = createTestStore({
                wallet: createEmptyWalletState(),
            });
            mockNostrGetPublicKey.mockImplementationOnce(() => {
                store.dispatch(walletSelected(WALLET_B));

                return Promise.resolve({ success: true, payload: { pubkey: OWN_NPUB } });
            });

            const result = await store.dispatch(loadIdentityThunk()).unwrap();

            expect(result).toEqual(err({ code: 'wallet_changed' }));
            expect(getPersistedActions()).toEqual([]);
        });
    });

    describe('shareFreshAddressWithContactThunk', () => {
        const receiveAddress = (address: string, index: number, transfers = 0) => ({
            address,
            path: `m/84'/0'/0'/0/${index}`,
            transfers,
            balance: '0',
            sent: '0',
            received: '0',
        });
        const account = mockWalletAccount({
            symbol: 'btc',
            deviceState: WALLET_A,
            path: "m/84'/0'/0'",
            addresses: {
                change: [],
                used: [],
                unused: [
                    receiveAddress(MY_ADDRESS, 0),
                    receiveAddress(MY_ADDRESS_2, 1),
                    receiveAddress(MY_ADDRESS_TOP, 2),
                ],
            },
        });

        const createShareStore = (params: CreateTestStateParams = {}) =>
            createTestStore({
                authority: anchoredAuthority(CONTACT_NPUB),
                accounts: [account],
                ...params,
            });

        const deviceDerivedAddress = (address: string) => ({
            success: true,
            payload: { address, path: [], serializedPath: "m/84'/0'/0'/0/0" },
        });

        beforeEach(() => {
            mockGetAddress.mockResolvedValue(deviceDerivedAddress(MY_ADDRESS));
        });

        it('has the device sign the address with my identity, records it and sends it', async () => {
            mockNostrSignEvent.mockImplementationOnce(params =>
                Promise.resolve({
                    success: true,
                    payload: signEventLikeDevice(params, OWN_SECRET),
                }),
            );
            const { store } = createShareStore();

            const result = await store
                .dispatch(
                    shareFreshAddressWithContactThunk({
                        npub: CONTACT_NPUB,
                        accountKey: account.key,
                    }),
                )
                .unwrap();

            expect(mockGetAddress).toHaveBeenCalledWith(
                expect.objectContaining({
                    device: expect.objectContaining({
                        state: expect.objectContaining({ staticSessionId: WALLET_A }),
                    }),
                    path: "m/84'/0'/0'/0/0",
                    coin: 'btc',
                    showOnTrezor: false,
                }),
            );
            expect(mockNostrSignEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    __experimental: true,
                    path: "m/44'/1237'/0'/0/0",
                    kind: ATTESTATION_KIND,
                    tags: [],
                    content: `${SLIP44_BTC}:${MY_ADDRESS}`,
                }),
            );
            expect(result).toEqual(
                ok(expect.objectContaining({ npub: OWN_NPUB, address: MY_ADDRESS })),
            );

            const shared =
                store.getState().contacts.byWallet[WALLET_A]?.sharedAddresses[MY_ADDRESS];
            expect(shared).toEqual({
                npub: CONTACT_NPUB,
                attestation: expect.objectContaining({ npub: OWN_NPUB, address: MY_ADDRESS }),
                sharedAt: expect.any(Number),
            });

            const [publishedDeviceState, publishedDraft] =
                mockPublishDraftToPool.mock.calls[0] ?? [];
            expect(publishedDeviceState).toBe(WALLET_A);
            expect(publishedDraft).toEqual({
                kind: KIND_ADDRESS_REPLY,
                tags: [['p', CONTACT_NPUB]],
                content: expect.any(String),
            });
            expect(decodeAttestation(publishedDraft?.content ?? '')).toEqual(shared?.attestation);
        });

        it('publishes nothing when the signature does not verify against my identity', async () => {
            // Signed by another key, as a wrong path or wallet would.
            mockNostrSignEvent.mockImplementationOnce(params =>
                Promise.resolve({
                    success: true,
                    payload: signEventLikeDevice(params, CONTACT_SECRET),
                }),
            );
            const { store } = createShareStore();

            const result = await store
                .dispatch(
                    shareFreshAddressWithContactThunk({
                        npub: CONTACT_NPUB,
                        accountKey: account.key,
                    }),
                )
                .unwrap();

            expect(result).toEqual(err({ code: 'invalid_attestation' }));
            expect(store.getState().contacts.byWallet[WALLET_A]?.sharedAddresses).toEqual({});
            expect(mockPublishDraftToPool).not.toHaveBeenCalled();
        });

        it('shares only with a contact anchored on this device', async () => {
            const { store } = createShareStore({ authority: undefined });

            const result = await store
                .dispatch(
                    shareFreshAddressWithContactThunk({
                        npub: CONTACT_NPUB,
                        accountKey: account.key,
                    }),
                )
                .unwrap();

            expect(result).toEqual(err({ code: 'unknown_contact' }));
            expect(mockNostrSignEvent).not.toHaveBeenCalled();
        });

        it('signs nothing when the device derives another address than the backend reported', async () => {
            mockGetAddress.mockResolvedValueOnce(
                deviceDerivedAddress('bc1qanotheraddress0000000000000000000000001'),
            );
            const { store } = createShareStore();

            const result = await store
                .dispatch(
                    shareFreshAddressWithContactThunk({
                        npub: CONTACT_NPUB,
                        accountKey: account.key,
                    }),
                )
                .unwrap();

            expect(result).toEqual(err({ code: 'address_mismatch' }));
            expect(mockNostrSignEvent).not.toHaveBeenCalled();
            expect(store.getState().contacts.byWallet[WALLET_A]?.sharedAddresses).toEqual({});
            expect(mockPublishDraftToPool).not.toHaveBeenCalled();
        });

        it('does not attest an address outside the account', async () => {
            const addressOfAnotherAccount = mockWalletAccount({
                ...account,
                addresses: {
                    change: [],
                    used: [],
                    unused: [
                        {
                            address: MY_ADDRESS,
                            path: "m/84'/0'/1'/0/0",
                            transfers: 0,
                            balance: '0',
                            sent: '0',
                            received: '0',
                        },
                        {
                            address: MY_ADDRESS_TOP,
                            path: "m/84'/0'/1'/0/1",
                            transfers: 0,
                            balance: '0',
                            sent: '0',
                            received: '0',
                        },
                    ],
                },
            });
            const { store } = createShareStore({ accounts: [addressOfAnotherAccount] });

            const result = await store
                .dispatch(
                    shareFreshAddressWithContactThunk({
                        npub: CONTACT_NPUB,
                        accountKey: addressOfAnotherAccount.key,
                    }),
                )
                .unwrap();

            expect(result).toEqual(err({ code: 'address_mismatch' }));
            expect(mockGetAddress).not.toHaveBeenCalled();
            expect(mockNostrSignEvent).not.toHaveBeenCalled();
        });

        it('publishes nothing when the device signed another serialization than the attestation', async () => {
            // The right key signs a valid event, but its id is not the attestation's.
            mockNostrSignEvent.mockImplementationOnce(params =>
                Promise.resolve({
                    success: true,
                    payload: signEventLikeDevice(
                        { ...params, content: `${params.content} ` },
                        OWN_SECRET,
                    ),
                }),
            );
            const { store } = createShareStore();

            const result = await store
                .dispatch(
                    shareFreshAddressWithContactThunk({
                        npub: CONTACT_NPUB,
                        accountKey: account.key,
                    }),
                )
                .unwrap();

            expect(result).toEqual(err({ code: 'invalid_attestation' }));
            expect(store.getState().contacts.byWallet[WALLET_A]?.sharedAddresses).toEqual({});
            expect(mockPublishDraftToPool).not.toHaveBeenCalled();
        });

        it('records and sends nothing when another wallet is selected during the confirmation', async () => {
            const { store, getPersistedActions } = createShareStore();
            mockNostrSignEvent.mockImplementationOnce(params => {
                store.dispatch(walletSelected(WALLET_B));

                return Promise.resolve({
                    success: true,
                    payload: signEventLikeDevice(params, OWN_SECRET),
                });
            });

            const result = await store
                .dispatch(
                    shareFreshAddressWithContactThunk({
                        npub: CONTACT_NPUB,
                        accountKey: account.key,
                    }),
                )
                .unwrap();

            expect(result).toEqual(err({ code: 'wallet_changed' }));
            expect(getPersistedActions()).toEqual([]);
            expect(mockPublishDraftToPool).not.toHaveBeenCalled();
        });

        it('sends nothing to a contact removed during the confirmation', async () => {
            const { store } = createShareStore();
            mockNostrSignEvent.mockImplementationOnce(params => {
                store.dispatch(
                    contactsActions.contactRemoved({ deviceState: WALLET_A, npub: CONTACT_NPUB }),
                );

                return Promise.resolve({
                    success: true,
                    payload: signEventLikeDevice(params, OWN_SECRET),
                });
            });

            const result = await store
                .dispatch(
                    shareFreshAddressWithContactThunk({
                        npub: CONTACT_NPUB,
                        accountKey: account.key,
                    }),
                )
                .unwrap();

            expect(result).toEqual(err({ code: 'unknown_contact' }));
            expect(store.getState().contacts.byWallet[WALLET_A]?.sharedAddresses).toEqual({});
            expect(mockPublishDraftToPool).not.toHaveBeenCalled();
        });

        it('sends nothing when the address went to another contact during the confirmation', async () => {
            const otherShare = {
                npub: NEW_NPUB,
                attestation: signedAttestation({ secret: OWN_SECRET, address: MY_ADDRESS }),
                sharedAt: Date.now(),
            };
            const { store } = createShareStore();
            mockNostrSignEvent.mockImplementationOnce(params => {
                store.dispatch(
                    contactsActions.sharedAddressRecorded({
                        deviceState: WALLET_A,
                        address: MY_ADDRESS,
                        shared: otherShare,
                    }),
                );

                return Promise.resolve({
                    success: true,
                    payload: signEventLikeDevice(params, OWN_SECRET),
                });
            });

            const result = await store
                .dispatch(
                    shareFreshAddressWithContactThunk({
                        npub: CONTACT_NPUB,
                        accountKey: account.key,
                    }),
                )
                .unwrap();

            expect(result).toEqual(err({ code: 'no_fresh_address' }));
            expect(
                store.getState().contacts.byWallet[WALLET_A]?.sharedAddresses[MY_ADDRESS],
            ).toEqual(otherShare);
            expect(mockPublishDraftToPool).not.toHaveBeenCalled();
        });

        it('skips an address given out on the Receive page and marks the shared one touched', async () => {
            mockGetAddress.mockResolvedValueOnce(deviceDerivedAddress(MY_ADDRESS_2));
            mockNostrSignEvent.mockImplementationOnce(params =>
                Promise.resolve({
                    success: true,
                    payload: signEventLikeDevice(params, OWN_SECRET),
                }),
            );
            const touchedOnReceivePage = { path: "m/84'/0'/0'/0/0", address: MY_ADDRESS };
            const { store } = createShareStore({
                receive: {
                    accounts: { [account.key]: { touchedAddresses: [touchedOnReceivePage] } },
                },
            });

            const result = await store
                .dispatch(
                    shareFreshAddressWithContactThunk({
                        npub: CONTACT_NPUB,
                        accountKey: account.key,
                    }),
                )
                .unwrap();

            expect(mockGetAddress).toHaveBeenCalledWith(
                expect.objectContaining({ path: "m/84'/0'/0'/0/1" }),
            );
            expect(result).toEqual(ok(expect.objectContaining({ address: MY_ADDRESS_2 })));
            expect(store.getState().receive.accounts[account.key]?.touchedAddresses).toEqual([
                { path: "m/84'/0'/0'/0/1", address: MY_ADDRESS_2 },
                touchedOnReceivePage,
            ]);
        });

        it('skips the address the Receive page shows, which copying does not mark touched', async () => {
            mockGetAddress.mockResolvedValueOnce(deviceDerivedAddress(MY_ADDRESS_2));
            mockNostrSignEvent.mockImplementationOnce(params =>
                Promise.resolve({
                    success: true,
                    payload: signEventLikeDevice(params, OWN_SECRET),
                }),
            );
            const { store } = createShareStore({
                receive: {
                    accounts: {
                        [account.key]: {
                            touchedAddresses: [],
                            currentFreshAddress: { path: "m/84'/0'/0'/0/0", address: MY_ADDRESS },
                        },
                    },
                },
            });

            const result = await store
                .dispatch(
                    shareFreshAddressWithContactThunk({
                        npub: CONTACT_NPUB,
                        accountKey: account.key,
                    }),
                )
                .unwrap();

            expect(mockGetAddress).toHaveBeenCalledWith(
                expect.objectContaining({ path: "m/84'/0'/0'/0/1" }),
            );
            expect(result).toEqual(ok(expect.objectContaining({ address: MY_ADDRESS_2 })));
        });

        it('shares no address once only the Receive page fallback is left', async () => {
            const { store } = createShareStore({
                receive: {
                    accounts: {
                        [account.key]: {
                            touchedAddresses: [],
                            currentFreshAddress: { path: "m/84'/0'/0'/0/1", address: MY_ADDRESS_2 },
                        },
                    },
                },
            });

            const result = await store
                .dispatch(
                    shareFreshAddressWithContactThunk({
                        npub: CONTACT_NPUB,
                        accountKey: account.key,
                        path: "m/84'/0'/0'/0/2",
                    }),
                )
                .unwrap();

            expect(result).toEqual(err({ code: 'no_fresh_address' }));
            expect(mockGetAddress).not.toHaveBeenCalled();
            expect(mockNostrSignEvent).not.toHaveBeenCalled();
        });

        it('records and sends nothing when the address is paid during the confirmation', async () => {
            const { store, getPersistedActions } = createShareStore();
            mockNostrSignEvent.mockImplementationOnce(params => {
                store.dispatch(
                    accountReplaced({
                        ...account,
                        addresses: {
                            change: [],
                            used: [],
                            unused: [
                                receiveAddress(MY_ADDRESS, 0, 1),
                                receiveAddress(MY_ADDRESS_2, 1),
                                receiveAddress(MY_ADDRESS_TOP, 2),
                            ],
                        },
                    }),
                );

                return Promise.resolve({
                    success: true,
                    payload: signEventLikeDevice(params, OWN_SECRET),
                });
            });

            const result = await store
                .dispatch(
                    shareFreshAddressWithContactThunk({
                        npub: CONTACT_NPUB,
                        accountKey: account.key,
                    }),
                )
                .unwrap();

            expect(result).toEqual(err({ code: 'no_fresh_address' }));
            expect(getPersistedActions()).toEqual([]);
            expect(store.getState().receive.accounts[account.key]).toBeUndefined();
            expect(mockPublishDraftToPool).not.toHaveBeenCalled();
        });

        it('asks the device nothing for an account the selected wallet does not hold', async () => {
            const { store } = createShareStore({ accounts: [] });

            const result = await store
                .dispatch(
                    shareFreshAddressWithContactThunk({
                        npub: CONTACT_NPUB,
                        accountKey: account.key,
                    }),
                )
                .unwrap();

            expect(result).toEqual(err({ code: 'wallet_changed' }));
            expect(mockGetAddress).not.toHaveBeenCalled();
            expect(mockNostrSignEvent).not.toHaveBeenCalled();
        });
    });

    describe('ensureContactSyncThunk', () => {
        // The thunk remembers the relay list it last admitted. Turning the feature off resets it to
        // the empty list, so every case starts from the same point.
        beforeEach(async () => {
            const { store } = createTestStore({ isFeatureEnabled: false });
            await store.dispatch(ensureContactSyncThunk());
            jest.clearAllMocks();
        });

        it('admits the relay hosts before opening a pool for each wallet with an identity', async () => {
            const { store } = createTestStore();

            await store.dispatch(ensureContactSyncThunk());

            expect(mockSyncDesktopRelayAllowlist).toHaveBeenCalledWith([RELAY_URL]);
            expect(mockReconcileRelayPool).toHaveBeenCalledTimes(1);
            expect(mockReconcileRelayPool).toHaveBeenCalledWith(
                expect.objectContaining({
                    deviceState: WALLET_A,
                    subscription: {
                        urls: [RELAY_URL],
                        filters: [
                            {
                                '#p': [OWN_NPUB],
                                kinds: [KIND_ADDRESS_REQUEST, KIND_ADDRESS_REPLY],
                            },
                        ],
                    },
                }),
            );
            expect(mockSyncDesktopRelayAllowlist.mock.invocationCallOrder[0]).toBeLessThan(
                mockReconcileRelayPool.mock.invocationCallOrder[0] ?? 0,
            );
        });

        it('closes every pool and admits no relay host once the feature is off', async () => {
            const { store } = createTestStore();
            await store.dispatch(ensureContactSyncThunk());
            jest.clearAllMocks();
            const { store: disabledStore } = createTestStore({ isFeatureEnabled: false });

            await disabledStore.dispatch(ensureContactSyncThunk());

            expect(mockDisposeAllRelayPools).toHaveBeenCalled();
            expect(mockSyncDesktopRelayAllowlist).toHaveBeenCalledWith([]);
            expect(mockReconcileRelayPool).not.toHaveBeenCalled();
            expect(disabledStore.getState().contacts.relay).toEqual({
                isConnected: false,
                urlStatus: {},
            });
        });

        it('opens no pool without a relay', async () => {
            const { store } = createTestStore({ relayUrls: [] });

            await store.dispatch(ensureContactSyncThunk());

            expect(mockReconcileRelayPool).toHaveBeenCalledWith(
                expect.objectContaining({ deviceState: WALLET_A, subscription: undefined }),
            );
        });

        const getReconciledWallets = () =>
            mockReconcileRelayPool.mock.calls.map(([{ deviceState }]) => deviceState);

        it('keeps background pools only for remembered standard wallets', async () => {
            const { store } = createTestStore();
            [WALLET_B, WALLET_REMEMBERED, WALLET_NOT_REMEMBERED].forEach((deviceState, index) => {
                store.dispatch(
                    contactsActions.identityLoaded({
                        deviceState,
                        identityNpub: `${index + 1}`.repeat(64),
                    }),
                );
            });

            await store.dispatch(ensureContactSyncThunk());

            expect(mockDisposeRelayPoolsExcept).toHaveBeenCalledWith(
                new Set([WALLET_A, WALLET_REMEMBERED]),
            );
            expect(getReconciledWallets()).toEqual([WALLET_A, WALLET_REMEMBERED]);
        });

        it('opens the pool of a passphrase wallet while it is selected', async () => {
            const { store } = createTestStore();
            store.dispatch(
                contactsActions.identityLoaded({ deviceState: WALLET_B, identityNpub: NEW_NPUB }),
            );
            store.dispatch(walletSelected(WALLET_B));

            await store.dispatch(ensureContactSyncThunk());

            expect(getReconciledWallets()).toEqual([WALLET_A, WALLET_B]);
        });
    });

    describe('requestAddressFromContactThunk', () => {
        it('asks a contact anchored on this device for an address of one coin', async () => {
            const { store } = createTestStore({ authority: anchoredAuthority(CONTACT_NPUB) });

            await store.dispatch(
                requestAddressFromContactThunk({ npub: CONTACT_NPUB, slip44: SLIP44_BTC }),
            );

            expect(mockPublishDraftToPool).toHaveBeenCalledWith(WALLET_A, {
                kind: KIND_ADDRESS_REQUEST,
                tags: [['p', CONTACT_NPUB]],
                content: `${SLIP44_BTC}:${OWN_NPUB}`,
            });
        });

        it('does not ask a contact that is not anchored on this device', async () => {
            const { store } = createTestStore();

            await store.dispatch(
                requestAddressFromContactThunk({ npub: CONTACT_NPUB, slip44: SLIP44_BTC }),
            );

            expect(mockPublishDraftToPool).not.toHaveBeenCalled();
        });

        it('does not ask for a coin outside the exchange', async () => {
            const { store } = createTestStore({ authority: anchoredAuthority(CONTACT_NPUB) });

            await store.dispatch(requestAddressFromContactThunk({ npub: CONTACT_NPUB, slip44: 2 }));

            expect(mockPublishDraftToPool).not.toHaveBeenCalled();
        });
    });
});
