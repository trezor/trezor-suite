/* eslint-disable no-console -- verbose WARD dblookup diagnostics */
import { bytesToHex } from '@noble/hashes/utils.js';

import type { MethodPermission } from '@trezor/connect-common';
import { WardVerifySchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import type { MessagesSchema as Messages } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';
import type { ProofPackage } from '@trezor/ward';
import {
    computeMerkleRoot,
    evaluateProof,
    generateMerkleProof,
    loadHead,
    proofFor,
} from '@trezor/ward';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import * as settingsStore from '../../../data/settingsStore';
import { getWardManagerService } from '../wardManagerService';
import { WardSession } from '../wardSession';

const utf8Hex = (s: string) => bytesToHex(new TextEncoder().encode(s));

// Map a normalized app-layer ProofPackage onto WARDLookup wire params.
const toLookupParams = (address: string, pkg: ProofPackage): Messages.WARDLookup =>
    pkg.kind === 'membership'
        ? { address: utf8Hex(address), value: pkg.valueHex, proof: pkg.proof, counter: pkg.counter }
        : {
              address: utf8Hex(address),
              proof: pkg.proof,
              ...(pkg.witnessAddressHex !== undefined && {
                  witness_address: pkg.witnessAddressHex,
                  witness_value: pkg.witnessValueHex!,
                  witness_counter: pkg.witnessCounter!,
              }),
          };

export default class WardVerify extends AbstractMethod<'wardVerify', WardVerifySchema> {
    constructor(message: MethodMessage<'wardVerify'>) {
        const { payload } = message;
        Assert(WardVerifySchema, payload);

        const params = {
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
        const { address, networkSymbol, wardId } = this.params;
        const vlog = (...m: unknown[]) => console.log('[wardVerify]', ...m);

        // --- Application flow: resolve DB state + the entry under query. ---
        const { rows, tree } = await loadHead(provider, wardId);
        const entry = await provider.lookup(wardId, address, networkSymbol);
        const isMember = entry !== null;
        vlog('ENTER', {
            wardId,
            address,
            networkSymbol,
            isMember,
            mode: this.useDevice ? 'device' : 'offline',
        });

        if (!this.useDevice) {
            // Offline consistency: does the proof over stored rows round-trip to the stored root?
            const localRoot = tree?.root ?? computeMerkleRoot(rows);
            const computedRoot = isMember
                ? evaluateProof(
                      address,
                      networkSymbol,
                      entry,
                      generateMerkleProof(rows, address, networkSymbol),
                  )
                : computeMerkleRoot(rows);

            return { isMember, valid: computedRoot === localRoot, counter: entry?.counter ?? 0 };
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

        const pkg = proofFor(rows, address, networkSymbol, entry);
        const ack = await session.lookup(toLookupParams(address, pkg));
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
