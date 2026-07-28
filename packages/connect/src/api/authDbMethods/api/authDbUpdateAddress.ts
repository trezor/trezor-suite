/* eslint-disable no-console -- verbose AuthDB dbchange diagnostics */
import { bytesToHex } from '@noble/hashes/utils.js';

import type { MethodPermission } from '@trezor/connect-common';
import { AuthDbUpdateAddressSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import type { MessagesSchema as Messages } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';
import type { AuthLabelEntry, TreeState } from '@trezor/ward';
import {
    computeMerkleRoot,
    entryToValueBytes,
    generateMerkleProof,
    generateNonMembershipProof,
} from '@trezor/ward';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import * as settingsStore from '../../../data/settingsStore';
import { getWardManagerService } from '../wardManagerService';

const utf8Hex = (s: string) => bytesToHex(new TextEncoder().encode(s));

export default class AuthDbUpdateAddress extends AbstractMethod<
    'authDbUpdateAddress',
    AuthDbUpdateAddressSchema
> {
    private async bootstrapWardMvpOnly(
        cmd: ReturnType<ReturnType<typeof this.getDevice>['getCommands']>,
        walletId: string,
        treeState: TreeState | null,
        vlog: (...m: unknown[]) => void,
    ) {
        const counter = treeState?.counter ?? 0;
        const mac = treeState?.mac;
        const root = treeState?.root;
        const wardManager = getWardManagerService();

        // MVP: the high-level dbchange flow bootstrap-syncs the device to the host's
        // current tree state immediately before the authenticated WARD update round
        // (there is no auto-sync on reconnect yet).
        vlog('MVP bootstrap before device apply', {
            counter,
            root: root ?? '(none — empty tree)',
            mac: mac ?? '(none)',
        });

        vlog('-> WARDSync (device)');
        const sync = await cmd.typedCall('WARDSync', 'WARDSyncAck', {});
        const { nonce, version, wallet_id: deviceWalletId } = sync.message;
        vlog('<- WARDSyncAck', { nonce, version, wallet_id: deviceWalletId });

        if (deviceWalletId === undefined) {
            throw ERRORS.TypedError(
                'Runtime',
                'authDbUpdateAddress: device did not return a wallet_id for the sync round',
            );
        }
        if (deviceWalletId !== walletId) {
            throw ERRORS.TypedError(
                'Runtime',
                `authDbUpdateAddress: device wallet_id (${deviceWalletId}) does not match requested walletId (${walletId})`,
            );
        }

        vlog('-> WARD Manager service: sign attestation', {
            wallet_id: deviceWalletId,
            nonce,
            counter,
            mac: mac ?? '(none)',
        });
        const wmSignature = await wardManager.signAttestation({
            walletId: deviceWalletId,
            nonce,
            counter,
            mac,
        });
        vlog('<- WARD Manager service: attestation signature ready');

        vlog('-> WARDIngestAttestation (device)');
        const ingest = await cmd.typedCall('WARDIngestAttestation', 'WARDIngestAttestationAck', {
            counter,
            ...(mac !== undefined && { mac }),
            wm_signature: wmSignature,
        });
        vlog('<- WARDIngestAttestationAck', {
            counter: ingest.message.counter,
            wallet_id: ingest.message.wallet_id,
        });

        vlog('-> WARDReconcile (device)');
        const reconcile = await cmd.typedCall('WARDReconcile', 'WARDReconcileAck', {
            ...(root !== undefined && { root }),
        });
        vlog('<- WARDReconcileAck', {
            counter: reconcile.message.counter,
            new_root: reconcile.message.new_root,
            wallet_id: reconcile.message.wallet_id,
            root_mac: reconcile.message.root_mac,
        });
    }

    constructor(message: MethodMessage<'authDbUpdateAddress'>) {
        const { payload } = message;
        Assert(AuthDbUpdateAddressSchema, payload);

        const params = {
            address: payload.address,
            networkSymbol: payload.networkSymbol,
            metadata: payload.metadata,
            walletId: payload.walletId,
        };

        super(message, params);
        // No `device` supplied means offline mode: persist locally and recompute the root
        // without a device round-trip (see run()). Auto-selecting a connected device is not
        // supported for this method — callers that want the device must name it explicitly.
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
            label: 'Update the auth-label entry for this address on the device?',
        };
    }

    get info() {
        return 'Update AuthDB address entry';
    }

    async run() {
        const provider = settingsStore.get('wardDataProvider');
        if (!provider) {
            throw ERRORS.TypedError(
                'Runtime',
                'authDbUpdateAddress requires wardDataProvider to be set via TrezorConnect.init()',
            );
        }
        const wardManager = getWardManagerService();

        const { address, networkSymbol, metadata, walletId } = this.params;
        // Verbose diagnostics — prefixed so they're greppable in connect-cli output.
        const vlog = (...m: unknown[]) => console.log('[authDbUpdateAddress]', ...m);

        const [rows, oldEntry, currentTreeState] = await Promise.all([
            provider.getAllEntries(walletId),
            provider.lookup(walletId, address, networkSymbol),
            provider.getTreeState(walletId),
        ]);

        const isInsert = oldEntry === null;
        // Leaf counter is the GLOBAL counter stamp: the new global counter this change
        // produces (current global counter + 1) -- not a per-address increment. Matches
        // the firmware, which requires new_counter == current root counter + 1.
        const newEntry: AuthLabelEntry = {
            metadata,
            counter: (currentTreeState?.counter ?? 0) + 1,
        };

        vlog('ENTER', {
            walletId,
            address,
            networkSymbol,
            mode: this.useDevice ? 'device' : 'offline',
            op: isInsert ? 'INSERT/INIT' : 'UPDATE',
            localRows: rows.length,
            oldCounter: oldEntry?.counter ?? null,
            newCounter: newEntry.counter,
            currentGlobalCounter: currentTreeState?.counter ?? 0,
            metadata,
        });
        vlog('current local root (before op)', {
            root: currentTreeState?.root ?? '(none — empty tree)',
            counter: currentTreeState?.counter ?? 0,
        });

        if (!this.useDevice) {
            await provider.upsert(walletId, address, networkSymbol, newEntry);
            const updatedRows = await provider.getAllEntries(walletId);
            const root = computeMerkleRoot(updatedRows);
            await provider.setTreeState(walletId, { root, counter: newEntry.counter });
            vlog('OFFLINE done', { counter: newEntry.counter, root });

            return { counter: newEntry.counter, root };
        }

        const oldValueHex = isInsert ? '' : bytesToHex(entryToValueBytes(networkSymbol, oldEntry));
        const newValueHex = bytesToHex(entryToValueBytes(networkSymbol, newEntry));

        const nonMembership = isInsert
            ? generateNonMembershipProof(rows, address, networkSymbol)
            : null;
        const proof = isInsert
            ? (nonMembership?.proof ?? [])
            : generateMerkleProof(rows, address, networkSymbol);

        vlog('proof built from wardDataProvider', {
            oldValueHex: oldValueHex || '(empty)',
            newValueHex,
            proofLen: proof.length,
            proof,
            witnessAddress: nonMembership?.witnessAddress ?? null,
            witnessValue: nonMembership?.witnessValue
                ? bytesToHex(nonMembership.witnessValue)
                : null,
            witnessCounter: nonMembership?.witnessCounter ?? null,
        });

        const cmd = this.getDevice().getCommands();
        await this.bootstrapWardMvpOnly(cmd, walletId, currentTreeState, vlog);

        // Pull model: the host no longer pushes the proof up-front inside the queue
        // step. Instead it answers a WARDProofRequest the device emits during
        // WARDPerformUpdate, with the membership proof (UPDATE/DELETE) or the
        // non-membership witness (INSERT) for the address being edited.
        const proofAck: Messages.WARDProofAck = isInsert
            ? {
                  proof,
                  ...(nonMembership?.witnessAddress !== null &&
                      nonMembership?.witnessAddress !== undefined && {
                          witness_address: utf8Hex(nonMembership.witnessAddress),
                          witness_value: bytesToHex(nonMembership.witnessValue!),
                          witness_counter: nonMembership.witnessCounter!,
                      }),
              }
            : {
                  value: oldValueHex,
                  proof,
                  counter: oldEntry.counter,
              };

        cmd.setWardProofCallback(request => {
            vlog('<- WARDProofRequest (device)', {
                address: request.address,
                pending_id: request.pending_id,
            });
            vlog('-> WARDProofAck', proofAck);

            return proofAck;
        });

        try {
            // Intent-only queue: the device shows a trusted queued update screen
            // and returns a pending_id ONLY on user approval. No proof is sent here.
            vlog('-> WARDQueueUpdate (device)');
            const queued = await cmd.typedCall('WARDQueueUpdate', 'WARDQueueUpdateAck', {
                address: utf8Hex(address),
                new_value: newValueHex,
            });
            const pendingId = queued.message.pending_id;
            vlog('<- WARDQueueUpdateAck', {
                counter: queued.message.counter,
                pending_id: pendingId,
                wallet_id: queued.message.wallet_id,
            });

            // Perform: the device pulls the proof (answered by the callback above) and
            // computes the candidate. The device counter is not advanced yet.
            vlog('-> WARDPerformUpdate (device)');
            const performed = await cmd.typedCall('WARDPerformUpdate', 'WARDPerformUpdateAck', {
                ...(pendingId !== undefined && { pending_id: pendingId }),
            });
            vlog('<- WARDPerformUpdateAck', {
                counter: performed.message.counter,
                new_root: performed.message.new_root,
                mac: performed.message.mac,
                wallet_id: performed.message.wallet_id,
            });

            const candidateCounter = performed.message.counter;
            const candidateMac = performed.message.mac;
            const deviceWalletId = performed.message.wallet_id;

            // Defense in depth: the caller-supplied walletId scopes local storage, but only
            // the device's own echoed wallet_id proves which seed+passphrase was actually
            // unlocked. Check it before signing, since the signature binds to this wallet_id.
            if (deviceWalletId !== undefined && deviceWalletId !== walletId) {
                vlog('REJECT wallet_id mismatch', {
                    deviceWalletId,
                    requestedWalletId: walletId,
                });
                throw ERRORS.TypedError(
                    'Runtime',
                    `authDbUpdateAddress: device wallet_id (${deviceWalletId}) does not match requested walletId (${walletId})`,
                );
            }
            if (deviceWalletId === undefined) {
                throw ERRORS.TypedError(
                    'Runtime',
                    'authDbUpdateAddress: device did not return a wallet_id for the WARD candidate',
                );
            }

            // WM final attestation over the exact device-derived candidate. The debug
            // signer stands in for the WARD Manager here; a real provisioned WM key is a
            // follow-up. A candidate that empties the tree has no root MAC, so the
            // signature is over the all-zero MAC and no `mac` field is sent.
            vlog('-> WARD Manager service: sign candidate', {
                wallet_id: deviceWalletId,
                counter: candidateCounter,
                mac: candidateMac ?? '(none)',
                pending_id: pendingId,
            });
            const wmSignature = await wardManager.signCandidate({
                walletId: deviceWalletId,
                counter: candidateCounter,
                mac: candidateMac,
            });
            vlog('<- WARD Manager service: candidate signature ready');

            vlog('-> WARDConfirmedByWM (device)');
            const response = await cmd.typedCall('WARDConfirmedByWM', 'WARDConfirmedByWMAck', {
                counter: candidateCounter,
                ...(candidateMac !== undefined && { mac: candidateMac }),
                wm_signature: wmSignature,
                ...(pendingId !== undefined && { pending_id: pendingId }),
            });
            vlog('<- WARDConfirmedByWMAck', {
                counter: response.message.counter,
                new_root: response.message.new_root,
                wallet_id: response.message.wallet_id,
                root_mac: response.message.root_mac,
            });

            // The device already installed this update by the time we reach this point — a
            // failure below means the local cache is now stale, not that the operation
            // failed. Surface that as `localCacheError` on an otherwise-successful result
            // instead of throwing, so callers still get the device-confirmed counter/root
            // and can decide how to react (e.g. resync from getAllEntries()).
            let localCacheError: string | undefined;
            try {
                await provider.upsert(walletId, address, networkSymbol, newEntry);
                if (response.message.new_root !== undefined) {
                    await provider.setTreeState(walletId, {
                        root: response.message.new_root,
                        counter: response.message.counter,
                        mac: response.message.root_mac,
                    });
                }
                vlog('local cache updated (upsert + setTreeState)');
            } catch (err) {
                localCacheError = err instanceof Error ? err.message : String(err);
                vlog('LOCAL CACHE ERROR (device already committed)', localCacheError);
            }

            vlog('DONE', {
                counter: response.message.counter,
                root: response.message.new_root ?? '',
            });

            return {
                counter: response.message.counter,
                root: response.message.new_root ?? '',
                ...(localCacheError !== undefined && { localCacheError }),
            };
        } finally {
            cmd.setWardProofCallback(undefined);
        }
    }
}
