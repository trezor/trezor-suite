// Re-verifies a verification record copied from the account details panel, from scratch: the proof
// bytes inside the record are verified again (native addon, or WASM with COLIBRI_TEST_RUNTIME=wasm)
// under the record's own checkpoint, and every fact the record states is compared with what this
// verifier reads from those bytes. Needs network access for the sync-committee data.
//   yarn workspace @suite/colibri-nonce-verifier verify-record <record.json>
import { getRuntime } from '@corpus-core/colibri-stateless';
import { sha256 } from '@noble/hashes/sha2.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { VerifiedNonce } from '@suite/desktop-app-api';

import { loadColibriRuntime } from '../src/colibriRuntime';
import { bytesToHex, hexToBytes, toDecimalString } from '../src/quantity';
import { DEFAULT_REQUEST_LIMITS, createRequestRouter } from '../src/requestRouter';
import { createFileStorage } from '../src/storage';
import { validateTrustManifest } from '../src/trustManifest';
import mainnetTrustManifest from '../src/trustManifest.mainnet.json';
import { verifyProofBytes } from '../src/verifyProofBytes';

const print = (line: string) => process.stdout.write(`${line}\n`);

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const readRecord = (file: string): VerifiedNonce => {
    const parsed: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (
        !isRecord(parsed) ||
        parsed.status !== 'verified' ||
        typeof parsed.address !== 'string' ||
        !isRecord(parsed.block) ||
        !isRecord(parsed.evidence) ||
        typeof parsed.evidence.proofHex !== 'string' ||
        !isRecord(parsed.evidence.trust) ||
        !/^0x[0-9a-f]{64}$/.test(String(parsed.evidence.trust.checkpointRoot))
    ) {
        throw new Error('not a verification record');
    }

    return parsed as unknown as VerifiedNonce;
};

const run = async () => {
    const file = process.argv[2];
    if (!file) throw new Error('usage: verify-record <record.json>');
    const record = readRecord(file);
    const proof = hexToBytes(record.evidence.proofHex);
    if (!proof) throw new Error('record proofHex is not hex');

    const manifest = validateTrustManifest(mainnetTrustManifest, Date.now());
    if (!manifest.success) throw new Error(`trust manifest: ${manifest.error}`);
    const { checkpointRoot } = record.evidence.trust;
    if (checkpointRoot !== manifest.manifest.checkpoint.root) {
        print(`note: the record was verified from checkpoint ${checkpointRoot}, which is not the`);
        print(`      shipped one; the re-verification starts from the record's checkpoint.`);
    }
    // A checkpoint from a later period could not sync backwards to the proof's period, so the
    // record's own anchor is used and gets its own storage.
    const storageDirectory = path.join(
        os.tmpdir(),
        'colibri-nonce-verify-record',
        checkpointRoot.slice(2, 18),
    );
    const loaded = await loadColibriRuntime({
        getRuntime,
        storage: createFileStorage(storageDirectory),
        allowedRuntimeKinds: process.env.COLIBRI_TEST_RUNTIME === 'wasm' ? ['wasm'] : ['native'],
    });
    if (!loaded.success) throw new Error(`runtime: ${loaded.detail}`);
    print(`runtime: ${loaded.handle.kind} colibri ${loaded.handle.revision}`);

    const router = createRequestRouter(
        {
            fetch: (url, init) => globalThis.fetch(url, init),
            onEndpointFailure: ({ phase, type, nodeIndex, reason }) =>
                print(`warn: ${phase} ${type} endpoint #${nodeIndex}: ${reason}`),
        },
        {
            endpoints: manifest.manifest.endpoints,
            limits: DEFAULT_REQUEST_LIMITS,
            signal: new AbortController().signal,
        },
    );
    const facts = await verifyProofBytes({
        runtime: loaded.handle.runtime,
        proof,
        address: record.address,
        checkpointRoot,
        router,
        // The record is a past observation; its block is not expected to be recent any more.
        minLatestBlockTs: 0n,
        signal: new AbortController().signal,
    });
    if (!facts.success) {
        print(`VERIFICATION FAILED: ${facts.failure.code} (${facts.failure.detail})`);
        process.exit(1);
    }
    const { header, consensus, nonce } = facts.value;

    const checks: [string, string, string][] = [
        ['proof sha256', bytesToHex(sha256(proof)).slice(2), record.evidence.proofSha256],
        ['nonce', toDecimalString(nonce), record.nonce],
        ['block number', toDecimalString(header.blockNumber), record.block.number],
        ['block hash', header.blockHash, record.block.hash],
        [
            'block timestamp',
            toDecimalString(header.timestampSeconds),
            record.block.timestampSeconds,
        ],
        ['parent hash', header.parentHash, record.evidence.header.parentHash],
        ['state root', header.stateRoot, record.evidence.header.stateRoot],
        ['beacon slot', toDecimalString(consensus.slot), record.evidence.consensus.slot],
        [
            'signed slot',
            toDecimalString(consensus.signedSlot),
            record.evidence.consensus.signedSlot,
        ],
        ['header proof', consensus.headerProof, record.evidence.consensus.headerProof],
        [
            'sync committee participants',
            String(consensus.syncCommitteeParticipants),
            String(record.evidence.consensus.syncCommitteeParticipants),
        ],
    ];
    let mismatches = 0;
    for (const [name, actual, expected] of checks) {
        const ok = actual === expected;
        if (!ok) mismatches += 1;
        print(
            `${ok ? 'ok      ' : 'MISMATCH'} ${name}: ${actual}${ok ? '' : ` (record says ${expected})`}`,
        );
    }
    const ageSeconds = Math.floor(Date.now() / 1000) - Number(header.timestampSeconds);
    print(`block age now: ${ageSeconds} s (freshness is not re-checked for a past record)`);
    print(mismatches === 0 ? 'RECORD VERIFIED' : `${mismatches} MISMATCH(ES)`);
    process.exit(mismatches === 0 ? 0 : 1);
};

run().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
