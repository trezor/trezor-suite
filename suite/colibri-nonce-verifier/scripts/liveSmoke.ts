// Live smoke test: runs the real verifier against the shipped trust manifest and the public prover /
// beacon endpoints from plain Node, outside Electron and outside Suite's Tor interceptor. Needs
// network access and a populated manifest; not part of CI.
//   yarn workspace @suite/colibri-nonce-verifier test:live [0x<address>]
import { getRuntime } from '@corpus-core/colibri-stateless';
import os from 'node:os';
import path from 'node:path';

import { createNonceVerifier } from '../src/createNonceVerifier';
import { createFileStorage, getStorageDirectory } from '../src/storage';
import mainnetTrustManifest from '../src/trustManifest.mainnet.json';

const DEFAULT_ADDRESS = '0xd2674dA94285660c9b2353131bef2d8211369A4B';

const print = (line: string) => process.stdout.write(`${line}\n`);

const run = async () => {
    const address = process.argv[2] ?? DEFAULT_ADDRESS;
    const storageDirectory = getStorageDirectory({
        appDataDirectory: path.join(os.tmpdir(), 'colibri-nonce-live-smoke'),
        chainId: mainnetTrustManifest.chainId,
        trustPolicyId: mainnetTrustManifest.policyId,
    });
    if (!storageDirectory) throw new Error('invalid trust policy id');
    print(`storage: ${storageDirectory}`);

    const verifier = createNonceVerifier(
        {
            clock: { nowMs: () => Date.now(), monotonicMs: () => performance.now() },
            fetch: (url, init) => globalThis.fetch(url, init),
            getColibriRuntime: getRuntime,
            logger: {
                info: message => print(`info: ${message}`),
                warn: message => print(`warn: ${message}`),
            },
        },
        {
            trustManifest: mainnetTrustManifest,
            storage: createFileStorage(storageDirectory),
            allowedRuntimeKinds: ['native'],
        },
    );

    print(`info: ${JSON.stringify(await verifier.getInfo())}`);
    const started = performance.now();
    const result = await verifier.verify({ requestId: 'live-smoke', chainId: '1', address });
    print(
        `result (${Math.round(performance.now() - started)} ms): ${JSON.stringify(result, null, 2)}`,
    );
    process.exit(result.status === 'verified' ? 0 : 1);
};

run().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});
