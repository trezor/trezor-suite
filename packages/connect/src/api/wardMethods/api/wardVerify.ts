/* eslint-disable no-console -- verbose WARD dblookup diagnostics */
import { bytesToHex } from '@noble/hashes/utils.js';

import type { MethodPermission } from '@trezor/connect-common';
import { WardVerifySchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';
import { blobRows, computeRootFromBlobs, loadHead } from '@trezor/ward';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import * as settingsStore from '../../../data/settingsStore';
import { buildAckByKey } from '../proofAck';
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

        // PULL verify: send WARDLookup with NO pushed proof material, so the DEVICE
        // computes the target entry_key and pulls the proof; we answer reactively from
        // the entry_keys already in the DB. This makes BOTH membership and
        // non-membership device-proven — the host never needs the target entry_key, so
        // an absent address yields a real proven non-membership (not host-side guess).
        const preBlobs = blobRows(rows);
        const ack = await session.lookupPull(
            { address: utf8Hex(address), app_id: appId, key_type: 'address', proof: [] },
            req => buildAckByKey(preBlobs, req.entry_key),
        );
        const membership = ack.membership ?? isMember;
        // A host that believes the entry exists but whose proof the device rejects is
        // the silent-failure case — make it loud, never mistaken for "no label".
        if (isMember && !ack.valid) {
            console.error(
                `[wardVerify] MEMBERSHIP PROOF FAILED verification on device for ` +
                    `wardId=${wardId} appId=${appId} address=${address} — the host state did ` +
                    "not match the device's authenticated root (stale/inconsistent host state?).",
            );
        } else {
            vlog('result', { isMember: membership, valid: ack.valid, counter: ack.counter });
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
            isMember: membership,
            valid: ack.valid,
            counter: ack.counter,
            wardId: ack.ward_id,
        };
    }
}
