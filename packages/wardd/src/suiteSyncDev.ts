/**
 * A LOCAL STAND-IN FOR SUITE SYNC'S QUOTA MANAGER, for development and tests: the relay's admission
 * and quota decisions follow the production service (`trezor-suite-sync`), so that WARD meets the
 * same refusals it would meet there.
 *
 * WHAT MATCHES PRODUCTION.
 * - The relay admits an owner only while the Quota Manager holds a storage limit for it, and accepts
 *   a write only while the owner's stored bytes stay within that limit.
 * - `/challenge`, `/storage/ask` and `/storage/add` take and return what production does. A
 *   challenge is single-use and bound to its session, and `/storage/add` verifies the P-256
 *   signature over the same `EvoluAddSpaceToOwnerV1` message with SHA-256 ECDSA, and moves the
 *   bytes from the device's unspent quota to the owner.
 *
 * WHAT DOES NOT. Device registration: production registers a device from a signature its
 * authenticity certificate vouches for (`/storage/register`). Here a device is granted quota
 * directly (`grant`, or `--device-allowance` for every device that asks), because a test stack has
 * no genuine device. Limits live in memory, or in a JSON file when one is given.
 *
 * TEST CONTROL, which production has no counterpart of: `/dev/owner-limit` sets an owner's limit,
 * so a test can use up an owner's storage without writing tens of kilobytes first.
 */
import { createPublicKey, randomBytes, verify } from 'crypto';
import { promises as fs } from 'fs';
import http from 'http';

import { addSpaceToOwnerMessage } from '@trezor/ward-core';

const SPKI_P256_PREFIX = Buffer.from('3059301306072a8648ce3d020106082a8648ce3d030107034200', 'hex');

/** A device's raw uncompressed P-256 key as Node's verifier takes it. */
const p256Key = (publicKey: string) =>
    createPublicKey({
        key: Buffer.concat([SPKI_P256_PREFIX, Buffer.from(publicKey, 'hex')]),
        format: 'der',
        type: 'spki',
    });

interface Limits {
    /** publicKey -> { total, unspent } */
    devices: Record<string, { totalSpace: number; unspentSpace: number }>;
    /** ownerId -> storage limit */
    owners: Record<string, number>;
}

export interface DevQuotaManagerOptions {
    /** grant this much to every device that asks for itself and is unknown; 0 grants nothing */
    deviceAllowance?: number;
    /** keep limits here across restarts */
    stateFile?: string;
    log?: (line: string) => void;
}

const CHALLENGE_TTL_MS = 5 * 60_000;

export class DevQuotaManager {
    private limits: Limits = { devices: {}, owners: {} };
    private readonly challenges = new Map<string, { challenge: string; at: number }>();

    private constructor(private readonly opts: DevQuotaManagerOptions) {}

    static async create(opts: DevQuotaManagerOptions = {}): Promise<DevQuotaManager> {
        const qm = new DevQuotaManager(opts);
        if (opts.stateFile) {
            try {
                qm.limits = JSON.parse(await fs.readFile(opts.stateFile, 'utf8')) as Limits;
            } catch (e) {
                if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
            }
        }

        return qm;
    }

    private async save() {
        if (!this.opts.stateFile) return;
        await fs.writeFile(`${this.opts.stateFile}.tmp`, JSON.stringify(this.limits));
        await fs.rename(`${this.opts.stateFile}.tmp`, this.opts.stateFile);
    }

    /** Give a device quota, as a successful registration would. */
    async grant(publicKey: string, size: number): Promise<void> {
        const device = this.limits.devices[publicKey] ?? { totalSpace: 0, unspentSpace: 0 };
        this.limits.devices[publicKey] = {
            totalSpace: device.totalSpace + size,
            unspentSpace: device.unspentSpace + size,
        };
        await this.save();
    }

    /** Set an owner's limit directly (tests). */
    async setOwnerLimit(ownerId: string, limit: number | null): Promise<void> {
        if (limit === null) delete this.limits.owners[ownerId];
        else this.limits.owners[ownerId] = limit;
        await this.save();
    }

    ownerLimit(ownerId: string): number | null {
        return this.limits.owners[ownerId] ?? null;
    }

    /** The relay's `isOwnerAllowed`: any registered storage limit. */
    isOwnerAllowed = (ownerId: string): boolean => this.ownerLimit(ownerId) !== null;

    /** The relay's `isOwnerWithinQuota`: `requiredBytes` already includes what is stored. */
    isOwnerWithinQuota = (ownerId: string, requiredBytes: number): boolean => {
        const limit = this.ownerLimit(ownerId);

        return limit !== null && limit >= requiredBytes;
    };

    /** One request; the status code and the JSON body to send. */
    async handle(
        route: string,
        body: Record<string, unknown>,
    ): Promise<{ status: number; body: Record<string, unknown> }> {
        if (route === '/challenge') {
            if (typeof body.sessionId !== 'string' || body.sessionId.length > 256) {
                return { status: 400, body: { error: 'sessionId' } };
            }
            const challenge = randomBytes(32).toString('hex');
            this.challenges.set(body.sessionId, { challenge, at: Date.now() });

            return { status: 200, body: { challenge } };
        }
        if (route === '/storage/ask') {
            if (typeof body.ownerId === 'string') {
                const limit = this.ownerLimit(body.ownerId);

                return limit === null
                    ? { status: 200, body: { status: 'NoQuota' } }
                    : { status: 200, body: { status: 'Allocated', totalSpace: limit } };
            }
            if (typeof body.publicKey === 'string') {
                if (!this.limits.devices[body.publicKey] && this.opts.deviceAllowance) {
                    await this.grant(body.publicKey, this.opts.deviceAllowance);
                    this.opts.log?.(`[qm] granted ${this.opts.deviceAllowance} B to a device`);
                }
                const device = this.limits.devices[body.publicKey];

                return device
                    ? { status: 200, body: { status: 'Allocated', ...device } }
                    : { status: 200, body: { status: 'NoQuota' } };
            }

            return { status: 400, body: { error: 'Either ownerId or publicKey is required' } };
        }
        if (route === '/storage/add') return this.add(body);
        if (route === '/dev/owner-limit') {
            const { ownerId, limit } = body;
            if (typeof ownerId !== 'string' || (limit !== null && typeof limit !== 'number')) {
                return { status: 400, body: { error: 'ownerId and limit (bytes, or null)' } };
            }
            await this.setOwnerLimit(ownerId, limit);
            this.opts.log?.(`[qm] TEST: owner ${ownerId} limit set to ${limit} B`);

            return { status: 200, body: { ownerId, limit } };
        }

        return { status: 404, body: { error: 'Not found' } };
    }

    private async add(body: Record<string, unknown>) {
        const { publicKey, ownerId, size, challenge, sessionId, proof } = body;
        if (
            typeof publicKey !== 'string' ||
            typeof ownerId !== 'string' ||
            typeof size !== 'number' ||
            !Number.isInteger(size) ||
            size < 0 ||
            typeof challenge !== 'string' ||
            typeof sessionId !== 'string' ||
            typeof proof !== 'string'
        ) {
            return { status: 400, body: { error: 'invalid request' } };
        }
        // single use, whatever follows
        const issued = this.challenges.get(sessionId);
        this.challenges.delete(sessionId);
        if (issued?.challenge !== challenge || Date.now() - issued.at > CHALLENGE_TTL_MS) {
            return { status: 400, body: { error: 'ChallengeValidationFailed' } };
        }
        let valid = false;
        try {
            valid = verify(
                'sha256',
                addSpaceToOwnerMessage({ publicKey, ownerId, challenge, size }),
                { key: p256Key(publicKey), dsaEncoding: 'ieee-p1363' },
                Buffer.from(proof, 'hex'),
            );
        } catch {
            valid = false;
        }
        if (!valid) return { status: 400, body: { error: 'ProofValidationFailed' } };
        const device = this.limits.devices[publicKey];
        if (!device || device.unspentSpace < size || size <= 0) {
            return { status: 400, body: { error: 'NoStorageAllowance' } };
        }
        device.unspentSpace -= size;
        this.limits.owners[ownerId] = (this.limits.owners[ownerId] ?? 0) + size;
        await this.save();
        this.opts.log?.(
            `[qm] ${size} B to owner ${ownerId} (now ${this.limits.owners[ownerId]} B)`,
        );

        return {
            status: 200,
            body: {
                publicKeyUnspentSpace: device.unspentSpace,
                ownerTotalSpace: this.limits.owners[ownerId],
            },
        };
    }

    /** Serve the HTTP API on `port` (0: any); resolves with the bound port and a stop. */
    listen(port: number): Promise<{ port: number; close: () => Promise<void> }> {
        const server = http.createServer((req, res) => {
            const chunks: Buffer[] = [];
            req.on('data', c => chunks.push(c as Buffer));
            req.on('end', async () => {
                let reply: { status: number; body: Record<string, unknown> };
                try {
                    const parsed: unknown = chunks.length
                        ? JSON.parse(Buffer.concat(chunks).toString('utf8'))
                        : {};
                    reply =
                        req.method === 'POST' && typeof parsed === 'object' && parsed !== null
                            ? await this.handle(
                                  new URL(req.url ?? '/', 'http://x').pathname.replace(/\/$/, ''),
                                  parsed as Record<string, unknown>,
                              )
                            : { status: 400, body: { error: 'POST a JSON object' } };
                } catch {
                    reply = { status: 400, body: { error: 'invalid JSON' } };
                }
                res.writeHead(reply.status, {
                    'content-type': 'application/json',
                    'access-control-allow-origin': '*',
                });
                res.end(JSON.stringify(reply.body));
            });
        });

        return new Promise((resolve, reject) => {
            server.once('error', reject);
            server.listen(port, '127.0.0.1', () => {
                const address = server.address();
                resolve({
                    port: typeof address === 'object' && address ? address.port : port,
                    close: () => new Promise(done => server.close(() => done())),
                });
            });
        });
    }
}
