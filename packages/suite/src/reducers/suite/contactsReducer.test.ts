import { debugInitialState } from '@suite/debug';
import { type ExperimentalFeature } from '@suite/experimental';
import { suiteSettingsInitialState } from '@suite/settings';
import { type StaticSessionId } from '@trezor/connect';

import { type Attestation } from 'src/utils/contacts/attestation';
import { SHARE_RECLAIM_WINDOW_MS } from 'src/utils/contacts/sharing';

import {
    type Contact,
    type ContactsFeatureRootState,
    type ContactsState,
    MAX_UNSPENT_CONTACT_ADDRESSES,
    type SharedAddress,
    canServeAddressRequest,
    contactDisplayLabel,
    contactPaymentNpub,
    contactsActions,
    contactsReducer,
    createEmptyAuthority,
    createEmptyWalletState,
    findContactByPaymentNpub,
    isLocallyAnchored,
    normalizeDeviceAuthority,
    resolveSharePeerNpub,
    sanitizeContactsWalletState,
    selectDeviceAuthority,
    selectHasPendingAddressRequests,
    selectIsContactsFeatureEnabled,
    selectRelayUrlStatuses,
} from './contactsReducer';

const WALLET_A = 'addrA@deviceA:1' as StaticSessionId;
const WALLET_B = 'addrB@deviceA:2' as StaticSessionId;

const contact = (npub: string, isVerified = false): Contact => ({
    npub,
    label: npub.slice(0, 6),
    addedAt: 1,
    isVerified,
});

const attestation = (npub: string, address: string): Attestation => ({
    npub,
    address,
    slip44: 0,
    createdAt: 1,
    kind: 27923,
    signature: 'a'.repeat(128),
    eventId: 'e'.repeat(64),
});

const sharedAddress = (npub: string, address: string, sharedAt = 1): SharedAddress => ({
    npub,
    attestation: attestation(npub, address),
    sharedAt,
});

const anchor = (state: ContactsState | undefined, npub: string, label: string) =>
    contactsReducer(state, contactsActions.contactAnchored({ deviceState: WALLET_A, npub, label }));

describe('contacts reducer', () => {
    // Regression: a shared empty-wallet template was mutated (and frozen) in place by immer,
    // leaking one wallet's contacts into another or throwing on a frozen map.
    describe('per-wallet isolation (no shared map template)', () => {
        it("does not leak one wallet's contacts into another initialized afterwards", () => {
            let state = contactsReducer(
                undefined,
                contactsActions.contactUpserted({ deviceState: WALLET_A, contact: contact('a1') }),
            );
            state = contactsReducer(
                state,
                contactsActions.identityLoaded({ deviceState: WALLET_B, identityNpub: 'id' }),
            );

            expect(Object.keys(state.byWallet[WALLET_B]!.contacts)).toHaveLength(0);
            expect(state.byWallet[WALLET_B]!.contacts).not.toBe(state.byWallet[WALLET_A]!.contacts);
        });

        it('does not throw when adding to a fresh wallet after another was initialized', () => {
            const first = contactsReducer(
                undefined,
                contactsActions.identityLoaded({ deviceState: WALLET_A, identityNpub: 'id' }),
            );

            expect(() =>
                contactsReducer(
                    first,
                    contactsActions.contactUpserted({
                        deviceState: WALLET_B,
                        contact: contact('b1'),
                    }),
                ),
            ).not.toThrow();
        });
    });

    it('keeps the original addedAt when a verify or rename upserts the contact again', () => {
        let state = contactsReducer(
            undefined,
            contactsActions.contactUpserted({ deviceState: WALLET_A, contact: contact('alice') }),
        );
        state = contactsReducer(
            state,
            contactsActions.contactUpserted({
                deviceState: WALLET_A,
                contact: { ...contact('alice', true), addedAt: 99, label: 'Alice' },
            }),
        );

        expect(state.byWallet[WALLET_A]!.contacts.alice).toEqual({
            npub: 'alice',
            label: 'Alice',
            addedAt: 1,
            isVerified: true,
        });
    });

    // Regression: a malicious known contact could re-sign another contact's address and take
    // over its attribution.
    describe('addressVerified first-writer-wins across identities', () => {
        it('does not let a different contact overwrite an existing address attribution', () => {
            let state = contactsReducer(
                undefined,
                contactsActions.addressVerified({
                    deviceState: WALLET_A,
                    attestation: attestation('alice', 'addr1'),
                }),
            );
            state = contactsReducer(
                state,
                contactsActions.addressVerified({
                    deviceState: WALLET_A,
                    attestation: attestation('mallory', 'addr1'),
                }),
            );

            expect(state.byWallet[WALLET_A]!.verifiedAddresses.addr1!.npub).toBe('alice');
        });

        it('still lets the same contact refresh its own attestation', () => {
            let state = contactsReducer(
                undefined,
                contactsActions.addressVerified({
                    deviceState: WALLET_A,
                    attestation: { ...attestation('alice', 'addr1'), createdAt: 1 },
                }),
            );
            state = contactsReducer(
                state,
                contactsActions.addressVerified({
                    deviceState: WALLET_A,
                    attestation: { ...attestation('alice', 'addr1'), createdAt: 2 },
                }),
            );

            expect(state.byWallet[WALLET_A]!.verifiedAddresses.addr1!.createdAt).toBe(2);
        });

        // Relays replay their backlog on every reconnect, and each change is a stored-wallet write.
        it('changes nothing for a refresh that is not newer than the stored attestation', () => {
            const stored = { ...attestation('alice', 'addr1'), createdAt: 2 };
            const initial = contactsReducer(
                undefined,
                contactsActions.addressVerified({ deviceState: WALLET_A, attestation: stored }),
            );
            let state = contactsReducer(
                initial,
                contactsActions.addressVerified({
                    deviceState: WALLET_A,
                    attestation: { ...stored, eventId: 'd'.repeat(64) },
                }),
            );
            state = contactsReducer(
                state,
                contactsActions.addressVerified({
                    deviceState: WALLET_A,
                    attestation: { ...stored, createdAt: 1, eventId: 'f'.repeat(64) },
                }),
            );

            expect(state).toBe(initial);
        });
    });

    describe('addressVerified cap on unpaid addresses', () => {
        const verifyAll = (attestations: Attestation[], initial?: ContactsState) =>
            attestations.reduce(
                (state, verified) =>
                    contactsReducer(
                        state,
                        contactsActions.addressVerified({
                            deviceState: WALLET_A,
                            attestation: verified,
                        }),
                    ),
                initial,
            );
        const aliceAddresses = (count: number, slip44 = 0) =>
            Array.from({ length: count }, (_, index) => ({
                ...attestation('alice', `addr-${slip44}-${index}`),
                slip44,
            }));

        it("stops storing a contact's new addresses for one coin at the cap", () => {
            const state = verifyAll(aliceAddresses(MAX_UNSPENT_CONTACT_ADDRESSES + 5));

            expect(Object.keys(state!.byWallet[WALLET_A]!.verifiedAddresses)).toHaveLength(
                MAX_UNSPENT_CONTACT_ADDRESSES,
            );
        });

        it('counts each coin and each contact on its own and frees a slot once an address is paid', () => {
            let state = verifyAll([
                ...aliceAddresses(MAX_UNSPENT_CONTACT_ADDRESSES),
                ...aliceAddresses(1, 1),
                attestation('bob', 'bob-addr'),
            ]);

            expect(Object.keys(state!.byWallet[WALLET_A]!.verifiedAddresses)).toHaveLength(
                MAX_UNSPENT_CONTACT_ADDRESSES + 2,
            );

            state = contactsReducer(
                state,
                contactsActions.contactAddressSpent({ deviceState: WALLET_A, address: 'addr-0-0' }),
            );
            state = verifyAll([attestation('alice', 'alice-new')], state);

            expect(state!.byWallet[WALLET_A]!.verifiedAddresses['alice-new']).toBeDefined();
        });

        it('still lets a contact at the cap refresh an address it already gave', () => {
            const atCap = verifyAll(aliceAddresses(MAX_UNSPENT_CONTACT_ADDRESSES));
            const state = verifyAll([{ ...attestation('alice', 'addr-0-0'), createdAt: 2 }], atCap);

            expect(state!.byWallet[WALLET_A]!.verifiedAddresses['addr-0-0']!.createdAt).toBe(2);
        });

        // Regression: re-signing stored addresses under the other coin type moved them out of the
        // full count, so a contact could grow its addresses without end.
        it('keeps a stored address on its coin, so re-signing it for another coin frees no slot', () => {
            const atCap = verifyAll(aliceAddresses(MAX_UNSPENT_CONTACT_ADDRESSES));
            const state = verifyAll(
                [
                    { ...attestation('alice', 'addr-0-0'), slip44: 1, createdAt: 2 },
                    { ...attestation('alice', 'alice-new'), createdAt: 2 },
                ],
                atCap,
            );

            expect(state!.byWallet[WALLET_A]!.verifiedAddresses).toEqual(
                atCap!.byWallet[WALLET_A]!.verifiedAddresses,
            );
        });
    });

    // Regression: one address shared with two contacts would link their payments to me.
    it('does not let one shared address be reassigned to a different contact', () => {
        let state = contactsReducer(
            undefined,
            contactsActions.sharedAddressRecorded({
                deviceState: WALLET_A,
                address: 'my1',
                shared: sharedAddress('alice', 'my1'),
            }),
        );
        state = contactsReducer(
            state,
            contactsActions.sharedAddressRecorded({
                deviceState: WALLET_A,
                address: 'my1',
                shared: sharedAddress('bob', 'my1'),
            }),
        );

        expect(state.byWallet[WALLET_A]!.sharedAddresses.my1!.npub).toBe('alice');
    });

    // Regression: a reclaimed address was published to the next contact but stayed recorded for
    // the first, so it stayed reclaimable and was handed out on every later share.
    it('reassigns a shared address once the earlier share is reclaimed', () => {
        let state = contactsReducer(
            undefined,
            contactsActions.sharedAddressRecorded({
                deviceState: WALLET_A,
                address: 'my1',
                shared: sharedAddress('alice', 'my1'),
            }),
        );
        state = contactsReducer(
            state,
            contactsActions.sharedAddressRecorded({
                deviceState: WALLET_A,
                address: 'my1',
                shared: sharedAddress('bob', 'my1', 1 + SHARE_RECLAIM_WINDOW_MS),
            }),
        );

        expect(state.byWallet[WALLET_A]!.sharedAddresses.my1).toEqual(
            sharedAddress('bob', 'my1', 1 + SHARE_RECLAIM_WINDOW_MS),
        );
    });

    it("purges a removed contact's addresses and spent marks", () => {
        let state = contactsReducer(
            undefined,
            contactsActions.contactUpserted({ deviceState: WALLET_A, contact: contact('alice') }),
        );
        state = contactsReducer(
            state,
            contactsActions.addressVerified({
                deviceState: WALLET_A,
                attestation: attestation('alice', 'addrA'),
            }),
        );
        state = contactsReducer(
            state,
            contactsActions.addressVerified({
                deviceState: WALLET_A,
                attestation: attestation('bob', 'addrB'),
            }),
        );
        state = contactsReducer(
            state,
            contactsActions.contactAddressSpent({ deviceState: WALLET_A, address: 'addrA' }),
        );
        state = contactsReducer(
            state,
            contactsActions.sharedAddressRecorded({
                deviceState: WALLET_A,
                address: 'mine1',
                shared: sharedAddress('alice', 'mine1'),
            }),
        );
        state = contactsReducer(
            state,
            contactsActions.sharedAddressUsed({ deviceState: WALLET_A, address: 'mine1' }),
        );

        state = contactsReducer(
            state,
            contactsActions.contactRemoved({ deviceState: WALLET_A, npub: 'alice' }),
        );

        const wallet = state.byWallet[WALLET_A]!;
        expect(wallet.contacts.alice).toBeUndefined();
        expect(wallet.verifiedAddresses.addrA).toBeUndefined();
        expect(wallet.spentContactAddresses.addrA).toBeUndefined();
        expect(wallet.sharedAddresses.mine1).toBeUndefined();
        expect(wallet.spentSharedAddresses.mine1).toBeUndefined();
        // Another contact's data is left alone.
        expect(wallet.verifiedAddresses.addrB!.npub).toBe('bob');
    });

    // Regression: the relay replays its backlog on reconnect; a served request must not be
    // served again.
    it('records served request ids without duplicates', () => {
        let state = contactsReducer(
            undefined,
            contactsActions.requestServed({ deviceState: WALLET_A, id: 'req1' }),
        );
        state = contactsReducer(
            state,
            contactsActions.requestServed({ deviceState: WALLET_A, id: 'req1' }),
        );
        state = contactsReducer(
            state,
            contactsActions.requestServed({ deviceState: WALLET_A, id: 'req2' }),
        );

        expect(state.byWallet[WALLET_A]!.servedRequestIds).toEqual(['req1', 'req2']);
    });

    it('marks the wallet as onboarded', () => {
        const state = contactsReducer(
            undefined,
            contactsActions.contactsOnboarded({ deviceState: WALLET_A }),
        );

        expect(state.byWallet[WALLET_A]!.isOnboarded).toBe(true);
        expect(state.byWallet[WALLET_B]).toBeUndefined();
    });

    it('tracks app-global relay status independently of per-wallet state', () => {
        let state = contactsReducer(
            undefined,
            contactsActions.relayStatusUpdated({ isConnected: true }),
        );
        expect(state.relay.isConnected).toBe(true);

        state = contactsReducer(state, contactsActions.relayStatusUpdated({ lastEventAt: 123 }));
        expect(state.relay).toEqual({ isConnected: true, lastEventAt: 123 });

        state = contactsReducer(state, contactsActions.relayStatusUpdated({ isConnected: false }));
        expect(state.relay.isConnected).toBe(false);
        expect(state.byWallet).toEqual({});
    });

    it('records per-relay url status and replaces it wholesale on each snapshot', () => {
        let state = contactsReducer(
            undefined,
            contactsActions.relayStatusUpdated({
                isConnected: true,
                urlStatus: { 'wss://a.relay': true, 'wss://b.relay': false },
            }),
        );
        expect(selectRelayUrlStatuses({ contacts: state })).toEqual({
            'wss://a.relay': true,
            'wss://b.relay': false,
        });

        // A removed relay drops out, and `isConnected` is untouched when the payload omits it.
        state = contactsReducer(
            state,
            contactsActions.relayStatusUpdated({ urlStatus: { 'wss://a.relay': false } }),
        );
        expect(state.relay.urlStatus).toEqual({ 'wss://a.relay': false });
        expect(state.relay.isConnected).toBe(true);
    });

    it('returns a stable empty url status before the first relay snapshot', () => {
        const state = contactsReducer(undefined, { type: 'init' });

        expect(selectRelayUrlStatuses({ contacts: state })).toEqual({});
        expect(selectRelayUrlStatuses({ contacts: state })).toBe(
            selectRelayUrlStatuses({ contacts: state }),
        );
    });

    describe('pending address requests inbox', () => {
        it('records a request and keeps the first-seen time across a contact retry', () => {
            let state = contactsReducer(
                undefined,
                contactsActions.addressRequestReceived({
                    deviceState: WALLET_A,
                    npub: 'alice',
                    slip44: 0,
                    eventId: 'evt1',
                    receivedAt: 100,
                }),
            );
            // A retry for the same coin (new event id) collapses onto the same entry.
            state = contactsReducer(
                state,
                contactsActions.addressRequestReceived({
                    deviceState: WALLET_A,
                    npub: 'alice',
                    slip44: 0,
                    eventId: 'evt2',
                    receivedAt: 200,
                }),
            );

            expect(state.byWallet[WALLET_A]!.pendingRequests).toEqual({
                'alice:0': {
                    npub: 'alice',
                    slip44: 0,
                    receivedAt: 100,
                    eventIds: ['evt1', 'evt2'],
                },
            });
            expect(selectHasPendingAddressRequests({ contacts: state }, WALLET_A)).toBe(true);
            expect(selectHasPendingAddressRequests({ contacts: state }, WALLET_B)).toBe(false);
            expect(selectHasPendingAddressRequests({ contacts: state }, undefined)).toBe(false);
        });

        it('keeps mainnet and testnet requests from one contact as separate entries', () => {
            let state = contactsReducer(
                undefined,
                contactsActions.addressRequestReceived({
                    deviceState: WALLET_A,
                    npub: 'alice',
                    slip44: 0,
                    eventId: 'evtMain',
                    receivedAt: 100,
                }),
            );
            state = contactsReducer(
                state,
                contactsActions.addressRequestReceived({
                    deviceState: WALLET_A,
                    npub: 'alice',
                    slip44: 1,
                    eventId: 'evtTest',
                    receivedAt: 200,
                }),
            );

            expect(state.byWallet[WALLET_A]!.pendingRequests).toEqual({
                'alice:0': { npub: 'alice', slip44: 0, receivedAt: 100, eventIds: ['evtMain'] },
                'alice:1': { npub: 'alice', slip44: 1, receivedAt: 200, eventIds: ['evtTest'] },
            });

            // Fulfilling the mainnet request must not drop the outstanding testnet one.
            state = contactsReducer(
                state,
                contactsActions.addressRequestCleared({
                    deviceState: WALLET_A,
                    npub: 'alice',
                    slip44: 0,
                }),
            );
            expect(state.byWallet[WALLET_A]!.pendingRequests).toEqual({
                'alice:1': { npub: 'alice', slip44: 1, receivedAt: 200, eventIds: ['evtTest'] },
            });
            expect(selectHasPendingAddressRequests({ contacts: state }, WALLET_A)).toBe(true);
        });

        it('ignores a request for a coin type outside the contacts exchange', () => {
            const state = contactsReducer(
                undefined,
                contactsActions.addressRequestReceived({
                    deviceState: WALLET_A,
                    npub: 'alice',
                    slip44: 2,
                    eventId: 'evtOther',
                    receivedAt: 100,
                }),
            );

            expect(state.byWallet[WALLET_A]).toBeUndefined();
            expect(selectHasPendingAddressRequests({ contacts: state }, WALLET_A)).toBe(false);
        });

        it('clears a fulfilled request', () => {
            let state = contactsReducer(
                undefined,
                contactsActions.addressRequestReceived({
                    deviceState: WALLET_A,
                    npub: 'alice',
                    slip44: 0,
                    eventId: 'evt1',
                    receivedAt: 100,
                }),
            );
            state = contactsReducer(
                state,
                contactsActions.addressRequestCleared({
                    deviceState: WALLET_A,
                    npub: 'alice',
                    slip44: 0,
                }),
            );

            expect(state.byWallet[WALLET_A]!.pendingRequests).toEqual({});
            expect(selectHasPendingAddressRequests({ contacts: state }, WALLET_A)).toBe(false);
        });

        it("drops all of a contact's pending requests when the contact is removed", () => {
            let state = contactsReducer(
                undefined,
                contactsActions.contactUpserted({
                    deviceState: WALLET_A,
                    contact: contact('alice'),
                }),
            );
            state = contactsReducer(
                state,
                contactsActions.addressRequestReceived({
                    deviceState: WALLET_A,
                    npub: 'alice',
                    slip44: 0,
                    eventId: 'evt1',
                    receivedAt: 100,
                }),
            );
            state = contactsReducer(
                state,
                contactsActions.addressRequestReceived({
                    deviceState: WALLET_A,
                    npub: 'alice',
                    slip44: 1,
                    eventId: 'evt2',
                    receivedAt: 150,
                }),
            );
            state = contactsReducer(
                state,
                contactsActions.contactRemoved({ deviceState: WALLET_A, npub: 'alice' }),
            );

            expect(state.byWallet[WALLET_A]!.pendingRequests).toEqual({});
        });

        it('dismisses a request and tombstones its event id so a backlog replay cannot resurrect it', () => {
            let state = contactsReducer(
                undefined,
                contactsActions.addressRequestReceived({
                    deviceState: WALLET_A,
                    npub: 'alice',
                    slip44: 0,
                    eventId: 'evt1',
                    receivedAt: 100,
                }),
            );
            state = contactsReducer(
                state,
                contactsActions.addressRequestDismissed({
                    deviceState: WALLET_A,
                    npub: 'alice',
                    slip44: 0,
                }),
            );

            expect(state.byWallet[WALLET_A]!.pendingRequests).toEqual({});
            expect(state.byWallet[WALLET_A]!.dismissedRequestIds).toEqual(['evt1']);
            expect(selectHasPendingAddressRequests({ contacts: state }, WALLET_A)).toBe(false);
        });

        // Regression: the entry remembered only the first event id, so the relay's replay of a
        // retry brought the dismissed row back.
        it('dismiss tombstones every retry event id, not just the first', () => {
            let state = contactsReducer(
                undefined,
                contactsActions.addressRequestReceived({
                    deviceState: WALLET_A,
                    npub: 'alice',
                    slip44: 0,
                    eventId: 'evt1',
                    receivedAt: 100,
                }),
            );
            state = contactsReducer(
                state,
                contactsActions.addressRequestReceived({
                    deviceState: WALLET_A,
                    npub: 'alice',
                    slip44: 0,
                    eventId: 'evt2',
                    receivedAt: 200,
                }),
            );
            state = contactsReducer(
                state,
                contactsActions.addressRequestDismissed({
                    deviceState: WALLET_A,
                    npub: 'alice',
                    slip44: 0,
                }),
            );

            expect(state.byWallet[WALLET_A]!.pendingRequests).toEqual({});
            expect(state.byWallet[WALLET_A]!.dismissedRequestIds).toEqual(['evt1', 'evt2']);
        });

        it('dismiss is a no-op when there is no matching pending request', () => {
            const state = contactsReducer(
                undefined,
                contactsActions.addressRequestDismissed({
                    deviceState: WALLET_A,
                    npub: 'ghost',
                    slip44: 0,
                }),
            );

            // Nothing is tombstoned, so a future request must still surface.
            expect(state.byWallet[WALLET_A]?.dismissedRequestIds ?? []).toEqual([]);
        });
    });
});

describe('contacts device authority', () => {
    it('contactAnchored records the anchor only in the device authority, making the contact payable', () => {
        const state = anchor(undefined, 'alice', 'Alice');

        const auth = selectDeviceAuthority({ contacts: state }, WALLET_A);
        expect(isLocallyAnchored(auth, 'alice')).toBe(true);
        expect(auth.anchoredNpubs.alice).toEqual({
            label: 'Alice',
            anchoredAt: expect.any(Number),
        });
        expect(state.byWallet[WALLET_A]).toBeUndefined();
        expect(contactPaymentNpub(contact('alice'), auth)).toBe('alice');
    });

    it('contactUnanchored drops the anchor so the contact is no longer payable', () => {
        let state = anchor(undefined, 'alice', 'Alice');
        state = contactsReducer(
            state,
            contactsActions.contactUnanchored({ deviceState: WALLET_A, npub: 'alice' }),
        );

        const auth = selectDeviceAuthority({ contacts: state }, WALLET_A);
        expect(isLocallyAnchored(auth, 'alice')).toBe(false);
        expect(contactPaymentNpub(contact('alice'), auth)).toBeUndefined();
    });

    it('contactRemoved drops the anchor, so a re-added contact is not payable without the device', () => {
        let state = contactsReducer(
            undefined,
            contactsActions.contactUpserted({ deviceState: WALLET_A, contact: contact('alice') }),
        );
        state = anchor(state, 'alice', 'Alice (device)');
        state = contactsReducer(
            state,
            contactsActions.contactRemoved({ deviceState: WALLET_A, npub: 'alice' }),
        );
        state = contactsReducer(
            state,
            contactsActions.contactUpserted({
                deviceState: WALLET_A,
                contact: { ...contact('alice'), label: 'local' },
            }),
        );

        const wallet = state.byWallet[WALLET_A]!;
        const auth = selectDeviceAuthority({ contacts: state }, WALLET_A);
        expect(isLocallyAnchored(auth, 'alice')).toBe(false);
        expect(contactPaymentNpub(wallet.contacts.alice!, auth)).toBeUndefined();
        expect(findContactByPaymentNpub(wallet, auth, 'alice')).toBeUndefined();
        expect(contactDisplayLabel(wallet.contacts.alice!, auth)).toBe('local');
    });

    it('a contact flagged verified is not payable without a local anchor', () => {
        const state = contactsReducer(
            undefined,
            contactsActions.contactUpserted({
                deviceState: WALLET_A,
                contact: contact('alice', true),
            }),
        );

        const auth = selectDeviceAuthority({ contacts: state }, WALLET_A);
        expect(contactPaymentNpub(contact('alice', true), auth)).toBeUndefined();
    });

    it('contactPaymentNpub on an empty authority fails closed', () => {
        expect(contactPaymentNpub(contact('alice', true), createEmptyAuthority())).toBeUndefined();
    });

    it('selectDeviceAuthority returns a stable empty authority for an unknown wallet', () => {
        const state = contactsReducer(undefined, { type: 'init' });

        expect(selectDeviceAuthority({ contacts: state }, WALLET_B)).toBe(
            selectDeviceAuthority({ contacts: state }, WALLET_B),
        );
        expect(selectDeviceAuthority({ contacts: state }, WALLET_B).anchoredNpubs).toEqual({});
    });

    it('prefers the label confirmed on the device', () => {
        const state = anchor(undefined, 'alice', 'Alice (device)');
        const auth = selectDeviceAuthority({ contacts: state }, WALLET_A);

        expect(contactDisplayLabel({ ...contact('alice'), label: 'local' }, auth)).toBe(
            'Alice (device)',
        );
        expect(contactDisplayLabel({ ...contact('bob'), label: 'local' }, auth)).toBe('local');
    });

    it('resolves payment and share peers only for locally anchored contacts', () => {
        let state = contactsReducer(
            undefined,
            contactsActions.contactUpserted({ deviceState: WALLET_A, contact: contact('alice') }),
        );
        state = contactsReducer(
            state,
            contactsActions.contactUpserted({ deviceState: WALLET_A, contact: contact('bob') }),
        );
        state = anchor(state, 'alice', 'Alice');
        // An anchor without a contact record resolves to nothing.
        state = anchor(state, 'carol', 'Carol');

        const wallet = state.byWallet[WALLET_A]!;
        const auth = selectDeviceAuthority({ contacts: state }, WALLET_A);

        expect(findContactByPaymentNpub(wallet, auth, 'alice')?.npub).toBe('alice');
        expect(findContactByPaymentNpub(wallet, auth, 'bob')).toBeUndefined();
        expect(findContactByPaymentNpub(wallet, auth, 'carol')).toBeUndefined();

        expect(resolveSharePeerNpub(wallet, auth, 'alice')).toBe('alice');
        expect(resolveSharePeerNpub(wallet, auth, 'bob')).toBeUndefined();
        expect(resolveSharePeerNpub(wallet, auth, 'carol')).toBeUndefined();
    });

    it('serves address requests to contacts only, anchored or not', () => {
        const state = contactsReducer(
            undefined,
            contactsActions.contactUpserted({ deviceState: WALLET_A, contact: contact('bob') }),
        );
        const wallet = state.byWallet[WALLET_A]!;

        expect(canServeAddressRequest(wallet, 'bob')).toBe(true);
        expect(canServeAddressRequest(wallet, 'stranger')).toBe(false);
    });
});

describe('contacts load-boundary sanitization (corrupt npub cannot crash the view)', () => {
    const GOOD = 'a'.repeat(64);
    // Never valid hex, so npubEncode would throw at render.
    const BAD = 'not-hex-☠';

    it('drops a contact with a non-hex map key', () => {
        const clean = sanitizeContactsWalletState({
            ...createEmptyWalletState(),
            contacts: {
                [GOOD]: contact(GOOD),
                [BAD]: { npub: BAD, label: 'corrupt', addedAt: 1, isVerified: false },
            },
        });

        expect(Object.keys(clean.contacts)).toEqual([GOOD]);
    });

    it('drops a contact whose record npub disagrees with its map key', () => {
        const clean = sanitizeContactsWalletState({
            ...createEmptyWalletState(),
            contacts: {
                [GOOD]: { npub: 'b'.repeat(64), label: 'mismatch', addedAt: 1, isVerified: false },
            },
        });

        expect(clean.contacts).toEqual({});
    });

    it('clears an invalid identityNpub and filters corrupt pending requests', () => {
        const clean = sanitizeContactsWalletState({
            ...createEmptyWalletState(),
            identityNpub: BAD,
            pendingRequests: {
                [`${GOOD}:0`]: { npub: GOOD, slip44: 0, receivedAt: 1, eventIds: ['e'] },
                [`${BAD}:0`]: { npub: BAD, slip44: 0, receivedAt: 1, eventIds: ['e'] },
            },
        });

        expect(clean.identityNpub).toBeUndefined();
        expect(Object.keys(clean.pendingRequests)).toEqual([`${GOOD}:0`]);
    });

    it('drops null and malformed records instead of throwing', () => {
        const storedContacts: Record<string, unknown> = {
            [GOOD]: contact(GOOD),
            ['c'.repeat(64)]: null,
            ['d'.repeat(64)]: { npub: 'd'.repeat(64), label: 42 },
        };
        const storedRequests: Record<string, unknown> = {
            [`${GOOD}:0`]: null,
            // A coin type outside the contacts exchange.
            [`${GOOD}:2`]: { npub: GOOD, slip44: 2, receivedAt: 1, eventIds: ['e'] },
            // A key the request would never be cleared by.
            [`${GOOD}:9`]: { npub: GOOD, slip44: 1, receivedAt: 1, eventIds: ['e'] },
        };

        const clean = sanitizeContactsWalletState({
            ...createEmptyWalletState(),
            // @ts-expect-error The records of a corrupt stored blob may have any shape.
            contacts: storedContacts,
            // @ts-expect-error The records of a corrupt stored blob may have any shape.
            pendingRequests: storedRequests,
        });

        expect(clean.contacts).toEqual({ [GOOD]: contact(GOOD) });
        expect(clean.pendingRequests).toEqual({});
    });

    it('rebuilds a stored contact without its unknown fields', () => {
        const storedContact = { ...contact(GOOD, true), messagingKeys: ['x'] };

        const clean = sanitizeContactsWalletState({
            ...createEmptyWalletState(),
            contacts: { [GOOD]: storedContact },
        });

        expect(clean.contacts).toEqual({ [GOOD]: contact(GOOD, true) });
    });

    it("keeps a contact's newest unpaid addresses up to the cap, and every paid one", () => {
        const verifiedAddresses = Object.fromEntries(
            Array.from({ length: MAX_UNSPENT_CONTACT_ADDRESSES + 2 }, (_, index) => [
                `addr${index}`,
                { ...attestation(GOOD, `addr${index}`), createdAt: index + 1 },
            ]),
        );

        const clean = sanitizeContactsWalletState({
            ...createEmptyWalletState(),
            verifiedAddresses,
            spentContactAddresses: { addr0: true },
        });

        // addr0 is paid and stays; of the unpaid ones, the oldest (addr1) goes.
        expect(Object.keys(clean.verifiedAddresses)).toHaveLength(
            MAX_UNSPENT_CONTACT_ADDRESSES + 1,
        );
        expect(clean.verifiedAddresses.addr0).toBeDefined();
        expect(clean.verifiedAddresses.addr1).toBeUndefined();
        expect(clean.verifiedAddresses.addr2).toBeDefined();
    });

    it('drops a stored contact address record that is not an object', () => {
        const storedAddresses: Record<string, unknown> = {
            good: attestation(GOOD, 'good'),
            corrupt: null,
        };

        const clean = sanitizeContactsWalletState({
            ...createEmptyWalletState(),
            // @ts-expect-error The records of a corrupt stored blob may have any shape.
            verifiedAddresses: storedAddresses,
        });

        expect(Object.keys(clean.verifiedAddresses)).toEqual(['good']);
    });

    it('keeps a valid identityNpub untouched', () => {
        const clean = sanitizeContactsWalletState({
            ...createEmptyWalletState(),
            identityNpub: GOOD,
        });

        expect(clean.identityNpub).toBe(GOOD);
    });

    it('fills every field missing from a partial blob', () => {
        const clean = sanitizeContactsWalletState({ contacts: { [GOOD]: contact(GOOD) } });

        expect(clean).toEqual({
            ...createEmptyWalletState(),
            identityNpub: undefined,
            contacts: { [GOOD]: contact(GOOD) },
        });
    });

    it('normalizeDeviceAuthority fills a missing anchored set', () => {
        expect(normalizeDeviceAuthority({})).toEqual({ anchoredNpubs: {} });
        expect(
            normalizeDeviceAuthority({
                anchoredNpubs: { [GOOD]: { label: 'x', anchoredAt: 1 } },
            }),
        ).toEqual({ anchoredNpubs: { [GOOD]: { label: 'x', anchoredAt: 1 } } });
    });

    // Any value under an npub would make that contact payable.
    it('normalizeDeviceAuthority drops a malformed anchor', () => {
        const storedAnchors: Record<string, unknown> = {
            [GOOD]: null,
            [BAD]: { label: 'corrupt', anchoredAt: 1 },
        };

        const auth = normalizeDeviceAuthority({
            // @ts-expect-error The anchors of a corrupt stored blob may have any shape.
            anchoredNpubs: storedAnchors,
        });

        expect(auth).toEqual({ anchoredNpubs: {} });
        expect(isLocallyAnchored(auth, GOOD)).toBe(false);
    });
});

describe('selectIsContactsFeatureEnabled', () => {
    const featureState = (
        experimental: ExperimentalFeature[] | undefined,
        isDebugModeActive: boolean,
    ): ContactsFeatureRootState => ({
        suiteSettings: { ...suiteSettingsInitialState, experimental },
        debug: { ...debugInitialState, showDebugMenu: isDebugModeActive },
    });

    it('is on only while the contacts feature is enabled and debug mode is active', () => {
        expect(selectIsContactsFeatureEnabled(featureState(['contacts'], true))).toBe(true);
        expect(selectIsContactsFeatureEnabled(featureState([], true))).toBe(false);
        expect(selectIsContactsFeatureEnabled(featureState(undefined, true))).toBe(false);
    });

    // The flag stays stored, but its toggle is hidden outside debug mode.
    it('is off after leaving debug mode, although the feature stays enabled', () => {
        expect(selectIsContactsFeatureEnabled(featureState(['contacts'], false))).toBe(false);
    });
});
