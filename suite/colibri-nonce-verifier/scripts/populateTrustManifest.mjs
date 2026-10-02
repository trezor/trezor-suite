// Fills the trusted checkpoint of src/trustManifest.mainnet.json from the finalized checkpoint that
// every configured checkpointz endpoint currently reports. All endpoints must agree; the result is
// written for review, it is not applied to a running app.
//
//   yarn workspace @suite/colibri-nonce-verifier trust-manifest:populate --policy-id <id> --expires <ISO date>
import fs from 'node:fs';
import path from 'node:path';

const GENESIS_TIME_SECONDS = 1606824023;
const SECONDS_PER_SLOT = 12;
const SLOTS_PER_EPOCH = 32;

const manifestPath = path.join(import.meta.dirname, '..', 'src', 'trustManifest.mainnet.json');

const parseArguments = argv => {
    const options = { policyId: null, expires: null };
    for (let index = 0; index < argv.length; index++) {
        if (argv[index] === '--policy-id') options.policyId = argv[++index] ?? null;
        else if (argv[index] === '--expires') options.expires = argv[++index] ?? null;
    }
    if (!options.policyId || !/^[A-Za-z0-9._-]{1,64}$/.test(options.policyId)) {
        throw new Error('--policy-id <A-Za-z0-9._-> is required');
    }
    if (!options.expires || Number.isNaN(Date.parse(options.expires))) {
        throw new Error('--expires <ISO date> is required');
    }

    return options;
};

const fetchFinalizedCheckpoint = async endpoint => {
    const url = `${endpoint.replace(/\/+$/, '')}/eth/v1/beacon/states/head/finality_checkpoints`;
    const response = await fetch(url, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`${url} answered HTTP ${response.status}`);
    const body = await response.json();
    const finalized = body?.data?.finalized;
    if (
        !/^0x[0-9a-f]{64}$/.test(finalized?.root ?? '') ||
        !/^[0-9]+$/.test(finalized?.epoch ?? '')
    ) {
        throw new Error(`${url} returned an unexpected finality checkpoint`);
    }

    return { root: finalized.root, epoch: Number(finalized.epoch), source: url };
};

const main = async () => {
    const { policyId, expires } = parseArguments(process.argv.slice(2));
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const endpoints = manifest.endpoints?.checkpointz ?? [];
    if (endpoints.length < 2) throw new Error('at least two checkpointz endpoints are required');

    const answers = await Promise.all(endpoints.map(fetchFinalizedCheckpoint));
    const roots = new Set(answers.map(answer => answer.root));
    if (roots.size !== 1) {
        throw new Error(
            `checkpointz endpoints disagree:\n${answers.map(a => `  ${a.source}: ${a.root}`).join('\n')}`,
        );
    }

    const [{ root, epoch }] = answers;
    const slot = epoch * SLOTS_PER_EPOCH;
    manifest.policyId = policyId;
    manifest.policyVersion = (manifest.policyVersion ?? 0) + 1;
    manifest.checkpoint = {
        root,
        epoch,
        slot,
        timestampSeconds: GENESIS_TIME_SECONDS + slot * SECONDS_PER_SLOT,
        sources: answers.map(answer => answer.source),
        obtainedAt: new Date().toISOString(),
    };
    manifest.reviewExpiresAt = new Date(expires).toISOString();

    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 4)}\n`);
    process.stdout.write(
        `wrote ${manifestPath}\n  root ${root}\n  epoch ${epoch} (slot ${slot})\n`,
    );
};

main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
