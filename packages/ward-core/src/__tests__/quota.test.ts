/**
 * The Quota Manager client for the WARD owner: the signed message is the one the Quota Manager
 * checks, and the allocation policy leaves Suite its share.
 */
import { p256 } from '@noble/curves/nist.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { createPublicKey, verify } from 'crypto';

import {
    type QuotaFetch,
    QuotaManagerError,
    SUITE_SYNC_RESERVE,
    WARD_STORAGE_INCREMENT,
    WARD_STORAGE_RESERVE,
    addSpaceToOwnerMessage,
    allocateOwnerStorage,
    askOwnerStorage,
    delegatedPublicKey,
    ensureOwnerStorage,
    wardStorageNeed,
} from '../quota';

const delegatedKey = bytesToHex(p256.utils.randomSecretKey());
const publicKey = delegatedPublicKey(delegatedKey);
const ownerId = '72SjeQ9enN4wz1d553Cpng';
const challenge = 'ab'.repeat(32);

/**
 * The message as the Quota Manager builds it to verify (`createStorageAddOperation` in
 * trezor-suite-sync): every field one length byte and its bytes, the size big-endian.
 */
const quotaManagerMessage = (size: number) => {
    const chunk = (b: Buffer) => Buffer.concat([Buffer.of(b.length), b]);
    const sizeBuffer = Buffer.alloc(4);
    sizeBuffer.writeUInt32BE(size, 0);

    return Buffer.concat([
        chunk(Buffer.from('EvoluAddSpaceToOwnerV1', 'utf8')),
        chunk(Buffer.from(publicKey, 'hex')),
        chunk(Buffer.from(ownerId, 'utf8')),
        chunk(Buffer.from(challenge, 'hex')),
        chunk(sizeBuffer),
    ]);
};

/** A Quota Manager answering from a table of routes; records what it was sent. */
const quotaManager = (
    routes: Record<string, (body: any) => { status: number; body: unknown }>,
): QuotaFetch & { sent: { route: string; body: any }[] } => {
    const sent: { route: string; body: any }[] = [];
    const fetch: QuotaFetch = (url, init) => {
        const route = new URL(url).pathname.replace(/^\/qm/, '');
        const body = JSON.parse(init.body);
        sent.push({ route, body });
        const handler = routes[route];
        const reply = handler ? handler(body) : { status: 404, body: { error: 'Not found' } };

        return Promise.resolve({ status: reply.status, json: () => Promise.resolve(reply.body) });
    };

    return Object.assign(fetch, { sent });
};

const QM_URL = 'http://quota.test/qm/';

describe('addSpaceToOwnerMessage', () => {
    it('is byte for byte the message the Quota Manager verifies', () => {
        expect(
            Buffer.from(addSpaceToOwnerMessage({ publicKey, ownerId, challenge, size: 65536 })),
        ).toEqual(quotaManagerMessage(65536));
    });
});

describe('wardStorageNeed', () => {
    it('asks for a first increment when the owner has no storage', () => {
        expect(wardStorageNeed({ storedBytes: 0, limitBytes: null })).toBe(WARD_STORAGE_INCREMENT);
    });

    it('asks for nothing while the reserve is left', () => {
        expect(
            wardStorageNeed({ storedBytes: 1000, limitBytes: 1000 + WARD_STORAGE_RESERVE }),
        ).toBe(0);
    });

    it('asks for enough whole increments to get back above the reserve', () => {
        expect(wardStorageNeed({ storedBytes: 200_000, limitBytes: 64 * 1024 })).toBe(
            3 * WARD_STORAGE_INCREMENT,
        );
    });

    it('asks for an increment after a refusal, even if the estimate fits', () => {
        expect(wardStorageNeed({ storedBytes: 0, limitBytes: 1 << 20, refused: true })).toBe(
            WARD_STORAGE_INCREMENT,
        );
    });
});

describe('askOwnerStorage', () => {
    it('reads a limit, no quota, and the older 404 reply', async () => {
        const answers = [
            { status: 200, body: { status: 'Allocated', totalSpace: 5 } },
            { status: 200, body: { status: 'NoQuota' } },
            { status: 404, body: { error: 'OwnerNotFound' } },
        ];
        const fetch = quotaManager({ '/storage/ask': () => answers.shift()! });
        const opts = { quotaManagerUrl: QM_URL, fetch };
        expect(await askOwnerStorage(opts, ownerId)).toBe(5);
        expect(await askOwnerStorage(opts, ownerId)).toBe(null);
        expect(await askOwnerStorage(opts, ownerId)).toBe(null);
        expect(fetch.sent[0]).toEqual({ route: '/storage/ask', body: { ownerId } });
    });

    it('reports an unreachable Quota Manager', async () => {
        const opts = { quotaManagerUrl: QM_URL, fetch: () => Promise.reject(new Error('down')) };
        await expect(askOwnerStorage(opts, ownerId)).rejects.toMatchObject({ kind: 'unreachable' });
    });
});

describe('allocateOwnerStorage', () => {
    it('signs the challenge with the delegated key, as the Quota Manager verifies it', async () => {
        const fetch = quotaManager({
            '/challenge': () => ({ status: 200, body: { challenge } }),
            '/storage/add': () => ({
                status: 200,
                body: { ownerTotalSpace: 65536, publicKeyUnspentSpace: 983040 },
            }),
        });
        const result = await allocateOwnerStorage({
            quotaManagerUrl: QM_URL,
            fetch,
            delegatedKey,
            ownerId,
            size: 65536,
        });
        expect(result).toEqual({
            allocated: 65536,
            ownerTotalSpace: 65536,
            deviceUnspentSpace: 983040,
        });
        const [asked, added] = fetch.sent;
        if (!asked || !added) throw new Error('expected a challenge and an add');
        expect(added.body).toMatchObject({
            publicKey,
            ownerId,
            size: 65536,
            challenge,
            sessionId: asked.body.sessionId,
        });
        // Node's verifier, as the Quota Manager's: SHA-256 ECDSA over the message, raw r||s
        const key = createPublicKey({
            key: Buffer.concat([
                Buffer.from('3059301306072a8648ce3d020106082a8648ce3d030107034200', 'hex'),
                Buffer.from(publicKey, 'hex'),
            ]),
            format: 'der',
            type: 'spki',
        });
        expect(
            verify(
                'sha256',
                quotaManagerMessage(65536),
                { key, dsaEncoding: 'ieee-p1363' },
                Buffer.from(added.body.proof, 'hex'),
            ),
        ).toBe(true);
    });

    it('tells a device without quota from a refused request', async () => {
        const refuse = (error: string) =>
            quotaManager({
                '/challenge': () => ({ status: 200, body: { challenge } }),
                '/storage/add': () => ({ status: 400, body: { error } }),
            });
        const allocate = (fetch: QuotaFetch) =>
            allocateOwnerStorage({
                quotaManagerUrl: QM_URL,
                fetch,
                delegatedKey,
                ownerId,
                size: 1,
            });
        await expect(allocate(refuse('NoStorageAllowance'))).rejects.toMatchObject({
            kind: 'no_device_quota',
        });
        await expect(allocate(refuse('ProofValidationFailed'))).rejects.toMatchObject({
            kind: 'refused',
        });
    });
});

describe('ensureOwnerStorage', () => {
    const device = (unspentSpace: number) =>
        quotaManager({
            '/storage/ask': body =>
                body.publicKey === publicKey
                    ? {
                          status: 200,
                          body: { status: 'Allocated', totalSpace: 1 << 20, unspentSpace },
                      }
                    : { status: 200, body: { status: 'NoQuota' } },
            '/challenge': () => ({ status: 200, body: { challenge } }),
            '/storage/add': body => ({
                status: 200,
                body: {
                    ownerTotalSpace: body.size,
                    publicKeyUnspentSpace: unspentSpace - body.size,
                },
            }),
        });

    it('allocates what is needed', async () => {
        const fetch = device(1 << 20);
        const result = await ensureOwnerStorage({
            quotaManagerUrl: QM_URL,
            fetch,
            delegatedKey,
            ownerId,
            needBytes: WARD_STORAGE_INCREMENT,
        });
        expect(result).toMatchObject({ kind: 'allocated', allocated: WARD_STORAGE_INCREMENT });
    });

    it("leaves Suite its reserve of the device's quota", async () => {
        const fetch = device(SUITE_SYNC_RESERVE + 1000);
        const result = await ensureOwnerStorage({
            quotaManagerUrl: QM_URL,
            fetch,
            delegatedKey,
            ownerId,
            needBytes: WARD_STORAGE_INCREMENT,
        });
        expect(result).toMatchObject({ kind: 'allocated', allocated: 1000 });
        await expect(
            ensureOwnerStorage({
                quotaManagerUrl: QM_URL,
                fetch: device(SUITE_SYNC_RESERVE),
                delegatedKey,
                ownerId,
                needBytes: WARD_STORAGE_INCREMENT,
            }),
        ).rejects.toBeInstanceOf(QuotaManagerError);
    });

    it('names an unregistered device', async () => {
        const fetch = quotaManager({
            '/storage/ask': () => ({ status: 200, body: { status: 'NoQuota' } }),
        });
        await expect(
            ensureOwnerStorage({
                quotaManagerUrl: QM_URL,
                fetch,
                delegatedKey,
                ownerId,
                needBytes: 1,
            }),
        ).rejects.toMatchObject({ kind: 'no_device_quota' });
    });

    it('allocates nothing when nothing is needed', async () => {
        const fetch = device(1 << 20);
        const result = await ensureOwnerStorage({
            quotaManagerUrl: QM_URL,
            fetch,
            delegatedKey,
            ownerId,
            needBytes: 0,
        });
        expect(result.kind).toBe('enough');
        expect(fetch.sent.map(s => s.route)).toEqual(['/storage/ask']);
    });
});
