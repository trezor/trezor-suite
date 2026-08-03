/* eslint-disable no-console -- verbose WARD dblookup diagnostics */
import { bytesToHex } from '@noble/hashes/utils.js';

import type { MethodPermission } from '@trezor/connect-common';
import { WardVerifySchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';
import { blobRows, computeRootFromBlobs, loadHead, proofByKey } from '@trezor/ward';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import * as settingsStore from '../../../data/settingsStore';
import { getWardManagerService } from '../wardManagerService';
import { WardSession } from '../wardSession';

const utf8Hex = (s: string) => bytesToHex(new TextEncoder().encode(s));

export default class WardVerify extends AbstractMethod<'wardVerify', WardVerifySchema> {
    constructor(message: MethodMessage<'wardVerify'>) {
        const { payload } = message;
        Assert(WardVerifySchema, payload);

        const params = {
            appId: payload.appId,
            address: payload.address,
            networkSymbol: payload.networkSymbol,
            wardId: payload.wardId,
        };

        super(message, params);
        // No `device` supplied means offline mode: verify local consistency (does the proof
        // over the stored entries round-trip to the stored root?) without a device round-trip.
        this.useDevice = payload.device !== undefined;
        this.useDeviceState = false;
        this.useEmptyPassphrase = true;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    get confirmation() {
        return {
            view: 'device-management' as const,
            label: 'Verify the auth-label entry for this address against the device?',
        };
    }

    get info() {
        return 'Verify WARD address entry';
    }

    async run() {
        const provider = settingsStore.get('wardDataProvider');
        if (!provider) {
            throw ERRORS.TypedError(
                'Runtime',
                'wardVerify requires wardDataProvider to be set via TrezorConnect.init()',
            );
        }
        const { appId, address, networkSymbol, wardId } = this.params;
        const vlog = (...m: unknown[]) => console.log('[wardVerify]', ...m);

        // --- Application flow: resolve DB state + the entry under query. ---
        const { rows, tree } = await loadHead(provider, wardId);
        if (tree?.root && rows.length === 0) {
            console.warn(
                `[wardVerify] INCONSISTENT host state for wardId=${wardId}: tree_state root present ` +
                    `(counter ${tree.counter}) but 0 address rows — non-membership proofs will lack a witness ` +
                    'and the device will reject them. The provider likely failed to persist entries.',
            );
        }
        const entry = await provider.lookup(wardId, appId, address, networkSymbol);
        const isMember = entry !== null;
        vlog('ENTER', {
            wardId,
            appId,
            address,
            networkSymbol,
            rows: rows.length,
            isMember,
            mode: this.useDevice ? 'device' : 'offline',
        });

        if (!this.useDevice) {
            // Offline consistency: the root over stored device leaf blobs must match the
            // stored checkpoint. (The host holds no keys, so it can only check blob-root
            // consistency — not decrypt/verify a specific entry.)
            const blobRoot = computeRootFromBlobs(blobRows(rows));
            const localRoot = tree?.root ?? blobRoot;

            return { isMember, valid: blobRoot === localRoot, counter: entry?.counter ?? 0 };
        }

        // --- WARD flow: verify the proof against the device's authenticated root. ---
        const session = new WardSession(this.getDevice().getCommands(), vlog);

        // Bootstrap: install the host's current authenticated root so the device has a
        // root to verify the lookup proof against — without it, firmware lookup rejects
        // with "no authenticated root in session" on a fresh session. Same sync round
        // wardUpdate/wardDisplayAddress use.
        const sync = await session.sync();
        WardSession.assertWardId(sync.wardId, wardId, 'wardVerify');
        // TODO(handoff, gap 2): WM signs the host-supplied (counter, mac) — see gaps.md #2.
        const attestation = await getWardManagerService().signAttestation({
            wardId,
            nonce: sync.nonce,
            counter: tree?.counter ?? 0,
            mac: tree?.mac,
        });
        await session.adopt(
            { counter: tree?.counter ?? 0, mac: tree?.mac, wmSignature: attestation },
            tree?.root,
        );

        // Non-membership PUSH-verify needs the DEVICE to compute the target entry_key
        // (a pull); the host holds no keys and cannot form it for an absent address.
        // Report host-DB absence without a device proof.
        if (entry === null) {
            vlog('result', {
                isMember: false,
                valid: false,
                note: 'non-membership (host-side only)',
            });

            return { isMember: false, valid: false, counter: 0 };
        }
        const blob = rows.find(
            r => r.appId === appId && r.address === address && r.networkSymbol === networkSymbol,
        )?.entry.blob;
        if (blob === undefined) {
            // Entry present but written before the keyed model (no leaf blob) — cannot
            // build a device-verifiable proof.
            return { isMember: true, valid: false, counter: entry.counter };
        }
        const ack = await session.lookup({
            address: utf8Hex(address),
            app_id: appId,
            key_type: blob.entryType,
            proof: proofByKey(blobRows(rows), blob.entryKey),
            nonce: blob.nonce,
            tag: blob.tag,
            ct: blob.ct,
        });
        // Explicit outcome logging: a membership entry whose proof the device rejects is
        // the silent-failure case. Make it loud so it is never mistaken for "no label".
        if (isMember && !ack.valid) {
            console.error(
                `[wardVerify] MEMBERSHIP PROOF FAILED verification on device for ` +
                    `wardId=${wardId} appId=${appId} address=${address} — the host proof did ` +
                    "not match the device's authenticated root (stale/inconsistent host state?).",
            );
        } else {
            vlog('result', { isMember, valid: ack.valid, counter: ack.counter });
        }
        // Tolerant echo check (matches prior behavior): only reject on an explicit
        // mismatch; an absent ward_id is not treated as a failure here.
        if (ack.ward_id !== undefined && ack.ward_id !== wardId) {
            throw ERRORS.TypedError(
                'Runtime',
                `wardVerify: device ward_id (${ack.ward_id}) does not match requested wardId (${wardId})`,
            );
        }

        return {
            isMember,
            valid: ack.valid,
            counter: ack.counter,
            wardId: ack.ward_id,
        };
    }
}
