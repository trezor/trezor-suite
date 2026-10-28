/* eslint-disable no-console */

import express, { type Express, type Request, type Response } from 'express';
import { createHash, createPublicKey, verify } from 'node:crypto';
import { type Server } from 'node:http';

import {
    MOCK_REDEMPTION_LIMIT_RESETS_AT,
    type MockReferralScenario,
    type MockReferralVoucher,
    mockReferralProgram,
    mockReferralScenarios,
} from './mockReferAFriendData';

export const REFER_A_FRIEND_MOCK_PORT = 4010;

const TIMESTAMP_WINDOW_SECONDS = 300;
const AUTHORIZATION_PATTERN =
    /^Referral v1; pubkey="([0-9a-f]{64})"; ts="(\d+)"; sig="([0-9a-f]{128})"$/;
// Uppercase letters and digits without the easily confused 0, O, 1 and I.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

type MockAccount = {
    status: 'active' | 'left';
    joinedAt: string;
    code: string;
    vouchers: MockReferralVoucher[];
};

type ApiErrorCode =
    'badRequest' | 'signatureInvalid' | 'timestampExpired' | 'accountRequired' | 'rateLimited';

const sendError = (res: Response, status: number, error: ApiErrorCode) =>
    res.status(status).json({ error });

const sha256Hex = (data: Buffer) => createHash('sha256').update(data).digest('hex');

// Deterministic per public key, so a restarted server gives the same account the same code.
const getReferralCode = (publicKey: string) =>
    Array.from(
        createHash('sha256').update(publicKey).digest().subarray(0, 8),
        byte => CODE_ALPHABET[byte % CODE_ALPHABET.length],
    ).join('');

const verifyEd25519 = (publicKeyHex: string, message: string, signatureHex: string) => {
    try {
        const publicKey = createPublicKey({
            key: {
                kty: 'OKP',
                crv: 'Ed25519',
                x: Buffer.from(publicKeyHex, 'hex').toString('base64url'),
            },
            format: 'jwk',
        });

        return verify(null, Buffer.from(message), publicKey, Buffer.from(signatureHex, 'hex'));
    } catch {
        return false;
    }
};

type ReferAFriendMockParams = {
    scenario: MockReferralScenario;
    port?: number;
};

/**
 * Mock of the Refer a Friend backend for development and E2E tests. Signatures are verified as the
 * real backend does it. Accounts live in memory, a restart forgets them. The scenario decides which
 * vouchers a joined account gets, or which error every signed endpoint returns.
 */
export class ReferAFriendMock {
    private readonly app: Express;
    private readonly accounts = new Map<string, MockAccount>();
    private readonly scenario: MockReferralScenario;
    private readonly port: number;
    private server: Server | null = null;

    constructor({ scenario, port = REFER_A_FRIEND_MOCK_PORT }: ReferAFriendMockParams) {
        this.scenario = scenario;
        this.port = port;
        this.app = this.createApp();
    }

    private getAccountResponse(account: MockAccount | undefined) {
        if (!account) {
            return {
                status: 'none',
                joinedAt: null,
                code: null,
                shareUrl: null,
                redemptionCount: null,
                redemptionLimit: null,
                redemptionLimitResetsAt: null,
            };
        }

        const isActive = account.status === 'active';

        return {
            status: account.status,
            joinedAt: account.joinedAt,
            code: isActive ? account.code : null,
            shareUrl: isActive ? `https://trezor.io/ref/${account.code}` : null,
            redemptionCount: account.vouchers.length,
            redemptionLimit: mockReferralProgram.redemptionLimit,
            redemptionLimitResetsAt: MOCK_REDEMPTION_LIMIT_RESETS_AT,
        };
    }

    // Returns the public key of a correctly signed request, or sends the error response.
    private authenticate(req: Request, res: Response): string | null {
        const match = req.header('Authorization')?.match(AUTHORIZATION_PATTERN);

        if (!match) {
            sendError(res, 401, 'signatureInvalid');

            return null;
        }

        const [, publicKey = '', timestamp = '', signature = ''] = match;
        const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
        const path = req.originalUrl.split('?')[0];
        const message = `v1\n${req.method}\n${path}\n${timestamp}\n${sha256Hex(body)}`;

        if (!verifyEd25519(publicKey, message, signature)) {
            sendError(res, 401, 'signatureInvalid');

            return null;
        }

        const nowSeconds = Math.floor(Date.now() / 1000);

        if (
            this.scenario === 'timestampExpired' ||
            Math.abs(nowSeconds - Number(timestamp)) > TIMESTAMP_WINDOW_SECONDS
        ) {
            sendError(res, 401, 'timestampExpired');

            return null;
        }

        if (this.scenario === 'rateLimited') {
            res.setHeader('Retry-After', '60');
            sendError(res, 429, 'rateLimited');

            return null;
        }

        return publicKey;
    }

    private createApp() {
        const app = express();

        app.use((req, res, next) => {
            console.log(`[mockReferAFriend]: ${req.method} ${req.originalUrl}`);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            if (req.method === 'OPTIONS') {
                return res.status(204).end();
            }

            next();
        });

        // Raw body, the signature covers its exact bytes.
        app.use(express.raw({ type: '*/*' }));

        app.get('/v1/program', (_req, res) => {
            res.json(mockReferralProgram);
        });

        app.get('/v1/account', (req, res) => {
            const publicKey = this.authenticate(req, res);
            if (publicKey === null) return;

            res.json(this.getAccountResponse(this.accounts.get(publicKey)));
        });

        app.post('/v1/account', (req, res) => {
            const publicKey = this.authenticate(req, res);
            if (publicKey === null) return;

            const account = this.accounts.get(publicKey);

            if (account?.status !== 'active') {
                this.accounts.set(publicKey, {
                    status: 'active',
                    joinedAt: new Date().toISOString(),
                    code: getReferralCode(publicKey),
                    // Rejoining keeps the vouchers, like the real backend keeps the counter.
                    vouchers: account?.vouchers ?? mockReferralScenarios[this.scenario](),
                });
            }

            res.json(this.getAccountResponse(this.accounts.get(publicKey)));
        });

        app.post('/v1/account/leave', (req, res) => {
            const publicKey = this.authenticate(req, res);
            if (publicKey === null) return;

            const account = this.accounts.get(publicKey);

            if (!account) {
                return sendError(res, 403, 'accountRequired');
            }

            account.status = 'left';
            res.json(this.getAccountResponse(account));
        });

        app.get('/v1/vouchers', (req, res) => {
            const publicKey = this.authenticate(req, res);
            if (publicKey === null) return;

            const account = this.accounts.get(publicKey);

            if (!account) {
                return sendError(res, 403, 'accountRequired');
            }

            res.json({ vouchers: account.vouchers });
        });

        return app;
    }

    start() {
        return new Promise<void>(resolve => {
            this.server = this.app.listen(this.port, () => {
                console.log(
                    `[mockReferAFriend]: listening at http://127.0.0.1:${this.port}/ with scenario "${this.scenario}"`,
                );
                resolve();
            });
        });
    }

    stop() {
        return new Promise<void>((resolve, reject) => {
            if (!this.server) {
                resolve();

                return;
            }

            this.server.close(error => (error ? reject(error) : resolve()));
            this.server.closeAllConnections();
            this.server = null;
        });
    }
}
