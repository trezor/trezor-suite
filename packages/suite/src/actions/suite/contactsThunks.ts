import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import TrezorConnect from '@trezor/connect';

import { contactsActions } from 'src/reducers/suite/contactsReducer';
import {
    type AuthLabelConnect,
    AuthLabelKeyType,
    LabelStore,
    type LabelStoreSnapshot,
    isStaleStateError,
} from 'src/utils/authlabel/labelStore';
import {
    ATTESTATION_KIND,
    type Attestation,
    assertAttestableAddress,
    attestationContent,
    attestationEventId,
    decodeAttestation,
    verifyAttestation,
} from 'src/utils/contacts/attestation';
import { hexToBytes, isValidNpubHex } from 'src/utils/contacts/npub';

const MODULE_PREFIX = '@suite/contacts';

/**
 * NIP-06 identity path. PINNED — a contact identity must always be derived from the
 * same path, otherwise a malicious host could make the device attest under a
 * different identity than the one the peer stored.
 */
export const IDENTITY_PATH = "m/44'/1237'/0'/0/0";

/** UTF-8 bytes; capped so a label still fits one line on the device screen. */
export const MAX_LABEL_BYTES = 32;

export class ContactsFirmwareError extends Error {}

const connectAdapter = (): AuthLabelConnect => ({
    authLabelGetState: params => TrezorConnect.authLabelGetState(params as never) as never,
    authLabelShow: params => TrezorConnect.authLabelShow(params as never) as never,
    authLabelChange: params => TrezorConnect.authLabelChange(params as never) as never,
});

const deviceParams = (device: TrezorDevice) => ({
    path: device.path,
    state: device.state,
    instance: device.instance,
    useEmptyPassphrase: device.useEmptyPassphrase,
});

export const encodeLabel = (label: string) => {
    const bytes = new TextEncoder().encode(label);
    if (bytes.length === 0) throw new Error('Label must not be empty');
    if (bytes.length > MAX_LABEL_BYTES) {
        throw new Error(`Label must be at most ${MAX_LABEL_BYTES} bytes`);
    }

    return bytes;
};

const requireDevice = (state: unknown) => {
    const device = selectSelectedDevice(state as never);
    const deviceState = device?.state?.staticSessionId;
    if (!device || !deviceState) throw new Error('No device');

    return { device, deviceState };
};

/**
 * Reads this wallet's contact identity (the nostr x-only pubkey) from the device.
 *
 * Note: the nostr methods are blocked on production firmware in
 * packages/connect/src/data/config.ts, and `getUnavailableCapabilities` ignores rules
 * without `capabilities` — so the block does NOT show up in device.unavailableCapabilities
 * and only surfaces here, as a call-time error. Hence the explicit mapping.
 */
export const loadIdentityThunk = createThunk(
    `${MODULE_PREFIX}/loadIdentity`,
    async (_: void, { dispatch, getState }) => {
        const { device, deviceState } = requireDevice(getState());

        const response = await TrezorConnect.nostrGetPublicKey({
            __experimental: true,
            path: IDENTITY_PATH,
            device: deviceParams(device),
        });

        if (!response.success) {
            const message = response.error?.message ?? 'Unknown error';
            if (/not supported|invalid package/i.test(message)) {
                throw new ContactsFirmwareError(message);
            }
            throw new Error(message);
        }

        const identityNpub = response.payload.pubkey;
        if (!isValidNpubHex(identityNpub)) {
            throw new Error('Device returned an unexpected identity format');
        }

        dispatch(contactsActions.identityLoaded({ deviceState, identityNpub }));

        return identityNpub;
    },
);

/**
 * Opens the device-authenticated trie for the current wallet.
 *
 * CRITICAL: we restore from the persisted snapshot and only fall back to
 * `bootstrap()` when there is nothing to restore (or the snapshot turned out to be
 * stale). `authLabelGetState` returns the MAC of the EMPTY root at the CURRENT
 * counter, so the device would silently accept an empty trie — bootstrapping on
 * every load would make the user's contacts vanish with no error at all.
 */
const openStore = async (
    device: TrezorDevice,
    snapshot: LabelStoreSnapshot | undefined,
): Promise<LabelStore> => {
    const connect = connectAdapter();
    const params = deviceParams(device);

    if (snapshot) {
        const restored = LabelStore.fromSnapshot(connect, snapshot, params);
        const verdict = await restored.verifyAgainstDevice();
        if (verdict === 'ok') return restored;
        // 'wallet-mismatch': the record belongs to another seed/passphrase.
        // 'stale': another client moved the counter on. Either way, start clean.
    }

    const store = new LabelStore(connect, params);
    await store.bootstrap();

    return store;
};

type ChangeArgs = { npub: string; label?: string };

const applyChange = (kind: 'add' | 'rename' | 'remove', args: ChangeArgs, store: LabelStore) => {
    const keyBytes = hexToBytes(args.npub);
    if (kind === 'remove') return store.delete(AuthLabelKeyType.NPUB, keyBytes);

    const label = args.label ?? '';
    encodeLabel(label); // validates length before we ask the user to confirm

    return kind === 'add'
        ? store.add(AuthLabelKeyType.NPUB, keyBytes, label)
        : store.update(AuthLabelKeyType.NPUB, keyBytes, label);
};

const makeChangeThunk = (kind: 'add' | 'rename' | 'remove') =>
    createThunk(
        `${MODULE_PREFIX}/${kind}Contact`,
        async (args: ChangeArgs, { dispatch, getState }) => {
            const { device, deviceState } = requireDevice(getState());
            if (!isValidNpubHex(args.npub)) throw new Error('Invalid identity');

            const state = getState() as {
                contacts: { byWallet: Record<string, { trieSnapshot?: LabelStoreSnapshot }> };
            };
            const persisted = state.contacts.byWallet[deviceState]?.trieSnapshot;

            let store = await openStore(device, persisted);
            try {
                await applyChange(kind, args, store);
            } catch (e) {
                if (!isStaleStateError(e)) throw e;
                // the device rejected our (root, counter) — re-sync and retry once
                store = await openStore(device, undefined);
                await applyChange(kind, args, store);
            }

            if (kind === 'remove') {
                dispatch(contactsActions.contactRemoved({ deviceState, npub: args.npub }));
            } else {
                dispatch(
                    contactsActions.contactUpserted({
                        deviceState,
                        contact: {
                            npub: args.npub,
                            label: args.label ?? '',
                            addedAt: Date.now(),
                        },
                    }),
                );
            }

            dispatch(
                contactsActions.trieSnapshotUpdated({ deviceState, snapshot: store.snapshot() }),
            );
        },
    );

export const addContactThunk = makeChangeThunk('add');
export const renameContactThunk = makeChangeThunk('rename');
export const removeContactThunk = makeChangeThunk('remove');

/**
 * BOB'S SIDE: ask the device to attest that a receive address is his.
 *
 * The device shows the address (getAddress) and then shows the exact content it is
 * about to sign (sign_event.py calls confirm_value), so the signature always covers
 * something the user saw on the device screen.
 */
export const attestAddressThunk = createThunk(
    `${MODULE_PREFIX}/attestAddress`,
    async (
        { slip44, path }: { slip44: number; path: string },
        { getState },
    ): Promise<Attestation> => {
        const { device } = requireDevice(getState());

        const identity = await TrezorConnect.nostrGetPublicKey({
            __experimental: true,
            path: IDENTITY_PATH,
            device: deviceParams(device),
        });
        if (!identity.success) throw new Error(identity.error?.message ?? 'Unknown error');
        const npub = identity.payload.pubkey;

        // let the user confirm the address on the device before attesting it
        const shown = await TrezorConnect.getAddress({
            device: deviceParams(device),
            path,
            showOnTrezor: true,
        });
        if (!shown.success) throw new Error(shown.error?.message ?? 'Unknown error');
        const { address } = shown.payload;
        assertAttestableAddress(address);

        const createdAt = Math.floor(Date.now() / 1000);
        const signed = await TrezorConnect.nostrSignEvent({
            __experimental: true,
            device: deviceParams(device),
            path: IDENTITY_PATH,
            created_at: createdAt,
            kind: ATTESTATION_KIND,
            tags: [],
            content: attestationContent(slip44, address),
        });
        if (!signed.success) throw new Error(signed.error?.message ?? 'Unknown error');

        const attestation: Attestation = {
            npub,
            address,
            slip44,
            createdAt,
            kind: ATTESTATION_KIND,
            signature: signed.payload.signature,
            eventId: signed.payload.id,
        };

        // Canary: recompute the id ourselves. If firmware serialization ever drifts
        // this fails here, at the source, instead of silently producing signatures
        // the peer cannot verify.
        if (attestationEventId(attestation) !== attestation.eventId) {
            throw new Error('Device event id does not match the expected serialization');
        }
        if (!verifyAttestation(attestation, npub)) {
            throw new Error('Device produced an attestation that does not verify');
        }

        return attestation;
    },
);

/**
 * ALICE'S SIDE: check an attestation against a contact she already confirmed on her
 * device, and remember the address if it holds.
 */
export const verifyAttestationThunk = createThunk(
    `${MODULE_PREFIX}/verifyAttestation`,
    ({ raw }: { raw: string }, { dispatch, getState }) => {
        const { deviceState } = requireDevice(getState());
        const attestation = decodeAttestation(raw);
        if (!attestation) throw new Error('Not a valid attestation');

        const state = getState() as {
            contacts: { byWallet: Record<string, { contacts: Record<string, { label: string }> }> };
        };
        const contact = state.contacts.byWallet[deviceState]?.contacts[attestation.npub];
        if (!contact) throw new Error('This attestation is not from any of your contacts');

        if (!verifyAttestation(attestation, attestation.npub)) {
            throw new Error('Signature does not verify against this contact');
        }

        dispatch(contactsActions.addressVerified({ deviceState, attestation }));

        return { attestation, label: contact.label };
    },
);

/**
 * ALICE'S SIDE, PRE-FLIGHT FOR SIGNING: make her own device verify, for each output
 * paid to a verified contact address, that
 *   (a) the contact carries a user-confirmed label in the MAC-bound trie, and
 *   (b) the address really was attested by that contact's identity.
 *
 * On success the device pins address -> label for the session, and the SignTx that
 * follows renders the contact name instead of the raw address. Nothing is attached
 * to the sign payload itself, which is what keeps this immune to output reordering
 * and to the RBF path that replaces `outputs` wholesale.
 *
 * MUST run with keepSession so no Initialize (which clears the pins) can fire
 * between the bind and the signature. If a pin is missing for any reason the device
 * simply shows the raw address — fail-open, never a wrong label.
 */
export const bindContactsForOutputsThunk = createThunk(
    `${MODULE_PREFIX}/bindContactsForOutputs`,
    async ({ addresses }: { addresses: string[] }, { getState }) => {
        const { device, deviceState } = requireDevice(getState());
        const state = getState() as {
            contacts: {
                byWallet: Record<
                    string,
                    {
                        trieSnapshot?: LabelStoreSnapshot;
                        verifiedAddresses?: Record<string, Attestation>;
                        contacts: Record<string, { label: string }>;
                    }
                >;
            };
        };
        const wallet = state.contacts.byWallet[deviceState];
        if (!wallet?.trieSnapshot) return 0;

        const store = LabelStore.fromSnapshot(
            connectAdapter(),
            wallet.trieSnapshot,
            deviceParams(device),
        );

        let bound = 0;
        for (const address of addresses) {
            const attestation = wallet.verifiedAddresses?.[address];
            if (!attestation) continue;
            if (!wallet.contacts[attestation.npub]) continue;
            // re-check locally before spending a device round-trip
            if (!verifyAttestation(attestation, attestation.npub)) continue;

            const keyBytes = hexToBytes(attestation.npub);
            const proof = store.proofFor(AuthLabelKeyType.NPUB, keyBytes);

            const res = await TrezorConnect.authLabelBindAddress({
                device: deviceParams(device),
                keepSession: true,
                key_type: AuthLabelKeyType.NPUB,
                key_bytes: attestation.npub,
                proof,
                mac: store.mac,
                address: attestation.address,
                slip44: attestation.slip44,
                created_at: attestation.createdAt,
                kind: attestation.kind,
                signature: attestation.signature,
            } as never);
            if ((res as { success: boolean }).success) bound++;
        }

        return bound;
    },
);
