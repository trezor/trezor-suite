import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { readFile } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';

import { type TreeState, commitOf } from '@trezor/ward';

import { EvoluWardStorage } from './evoluStorage';
import { silentLog } from './logging';
import { reconstructAvailable } from './recoveryReconstruction';
import { type SignedTransition } from './transition';

/** The WM's stdin: its head (the latest accepted transition's checkpoint) and the full lineage. */
type RecoveryRequest = {
    wardId: string;
    head: TreeState & { timestamp: number };
    history: SignedTransition[];
};

const main = async () => {
    const [relayUrl, ownerSecretFile] = process.argv.slice(2);
    if (!relayUrl || !ownerSecretFile) {
        throw new Error('Expected an Evolu relay URL and a WARD owner secret file');
    }
    const ownerSecret = hexToBytes((await readFile(ownerSecretFile, 'utf8')).trim());
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
        chunks.push(chunk);
    }
    const request: RecoveryRequest = JSON.parse(Buffer.concat(chunks).toString('utf8'));

    // A new in-memory replica can only receive the WARD records through the configured relay.
    const storage = await EvoluWardStorage.open({ dataDir: null, ownerSecret, relayUrl });
    try {
        const deadline = Date.now() + 4_000;
        do {
            const result = await reconstructAvailable({ ...request, storage, log: silentLog });
            if (result.complete) {
                const leaves = result.blobs.map(({ entryKeyHex, keyType, identity, content }) => ({
                    entryKey: entryKeyHex,
                    valueDigest: bytesToHex(commitOf(keyType, identity, content)),
                }));
                process.stdout.write(JSON.stringify(leaves));

                return;
            }
            await setTimeout(100);
        } while (Date.now() < deadline);
        throw new Error('The Evolu replica could not reconstruct the requested checkpoint');
    } finally {
        await storage.dispose();
    }
};

main().catch(error => {
    process.stderr.write(`${error instanceof Error ? error.message : 'Evolu read-back failed'}\n`);
    process.exitCode = 1;
});
