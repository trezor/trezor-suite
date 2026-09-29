import fs from 'node:fs';
import path from 'node:path';

import type { NonceVerifierClock, NonceVerifierLogger } from '../src/createNonceVerifier';
import { type ColibriStorage, createMemoryStorage } from '../src/storage';

// Recorded mainnet data from corpus-core/colibri-stateless test/data (MIT), revision
// 35af9d9452641b7be552437cb1e043f27e87de34. The proofs were produced by Colibri's local prover from
// those recordings; the pinned values below were read back from the decoded proofs.
export const MOCK_FIXTURES_DIRECTORY = path.join(__dirname, 'mockColibriFixtures');

export const mockNonceFixture = {
    directory: path.join(MOCK_FIXTURES_DIRECTORY, 'eth_getTransactionCount1'),
    address: '0xd2674dA94285660c9b2353131bef2d8211369A4B',
    nonce: '309747',
    proofSha256: 'fe305bbdd573ea4f14946582faa7bc36af6b79aecf783ea688dafdfdc00c3db1',
    block: {
        hash: '0x2bb879647b3cd84b0b8404a77d2853f73ebbd41d305677f15e9c6823a402ccdd',
        number: '22196327',
        timestampSeconds: 1743779015,
        parentHash: '0x35beeb10ab46366639d1a87a273336327b6c65120009e292f50f6532c64059b8',
        stateRoot: '0xf70ea20cff6800649ba5f2b83252c95cd86b025433f9a0d75b1179cc3f87257a',
    },
    checkpoint: {
        root: '0x71cef10fe5c40fb5abd3294e11a7b71992ace260dbb61948fe08f9a65f76d84e',
        epoch: 353025,
        slot: 11296800,
        timestampSeconds: 1742385623,
    },
} as const;

export const mockBalanceFixture = {
    directory: path.join(MOCK_FIXTURES_DIRECTORY, 'eth_getBalance1'),
    address: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
} as const;

export const MOCK_ENDPOINTS = {
    prover: ['https://prover.test'],
    beaconApi: ['https://beacon.test'],
    checkpointz: ['https://checkpointz.test'],
};

export const readMockFixture = (directory: string, name: string): Uint8Array =>
    new Uint8Array(fs.readFileSync(path.join(directory, name)));

// `Response` wants a plain ArrayBuffer; a sliced copy also detaches the body from the fixture.
export const toResponseBody = (bytes: Uint8Array): ArrayBuffer =>
    bytes.slice().buffer as ArrayBuffer;

// Colibri's Node runtime registers a default storage before it hands the runtime out, and its
// fs-backed variant loads `node:fs` through a dynamic import that jest's module VM rejects. With
// a localStorage-shaped global present it picks the synchronous variant instead; the verifier
// replaces the storage with its own right afterwards, so nothing is ever read from the shim.
export const installMockLocalStorage = () => {
    if ('localStorage' in globalThis) return;
    const entries = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: {
            getItem: (key: string) => entries.get(key) ?? null,
            setItem: (key: string, value: string) => {
                entries.set(key, String(value));
            },
            removeItem: (key: string) => {
                entries.delete(key);
            },
        },
    });
};

export const mockTrustManifest = (overrides: Record<string, unknown> = {}) => ({
    policyId: 'test-policy',
    policyVersion: 1,
    chainId: '1',
    checkpoint: {
        ...mockNonceFixture.checkpoint,
        sources: ['fixture'],
        obtainedAt: '2025-04-04T00:00:00Z',
    },
    endpoints: MOCK_ENDPOINTS,
    reviewExpiresAt: '2099-01-01T00:00:00Z',
    ...overrides,
});

// Sync-committee state as the verifier persists it after a successful bootstrap.
export const createMockWarmStorage = (): ColibriStorage =>
    createMemoryStorage({
        states_1: readMockFixture(mockNonceFixture.directory, 'states_1'),
        sync_1_1392: readMockFixture(mockNonceFixture.directory, 'sync_1_1392'),
        sync_1_1393: readMockFixture(mockNonceFixture.directory, 'sync_1_1393'),
    });

export type MockClock = NonceVerifierClock & {
    advance: (ms: number) => void;
    set: (ms: number) => void;
};

// Starts a few seconds after the fixture block so "latest" is fresh; monotonic time runs alongside.
export const createMockClock = (
    startMs = (mockNonceFixture.block.timestampSeconds + 5) * 1000,
): MockClock => {
    let wallMs = startMs;
    let monotonicMs = 1_000;

    return {
        nowMs: () => wallMs,
        monotonicMs: () => monotonicMs,
        advance: ms => {
            wallMs += ms;
            monotonicMs += ms;
        },
        set: ms => {
            wallMs = ms;
        },
    };
};

export const createMockLogger = (): NonceVerifierLogger & { messages: string[] } => {
    const messages: string[] = [];

    return {
        messages,
        info: message => {
            messages.push(`info: ${message}`);
        },
        warn: message => {
            messages.push(`warn: ${message}`);
        },
    };
};

const MOCK_NAME_SPECIAL_CHARACTERS = '/., :=?"&[]{}';

// Mirrors Colibri's `c4_req_mockname`: the request path becomes a file name in the fixture dir.
const toFixtureFileName = (pathAndQuery: string, accept: string | null) => {
    let name = '';
    for (const character of pathAndQuery) {
        name += MOCK_NAME_SPECIAL_CHARACTERS.includes(character) ? '_' : character;
    }
    const extension = accept?.includes('application/json') ? 'json' : 'ssz';

    return `${name.slice(0, 100)}.${extension}`;
};

export type MockFetchCall = {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: string | null;
};

export type CreateMockFixtureFetchParams = {
    proof: Uint8Array | null;
    beaconDirectory?: string;
    proverResponse?: () => Response;
    calls?: MockFetchCall[];
};

const toUrl = (input: string | URL | Request): string => {
    if (typeof input === 'string') return input;

    return input instanceof URL ? input.href : input.url;
};

export const createMockFixtureFetch =
    ({
        proof,
        beaconDirectory,
        proverResponse,
        calls,
    }: CreateMockFixtureFetchParams): typeof fetch =>
    (input, init) => {
        const url = toUrl(input);
        const headers = Object.fromEntries(new Headers(init?.headers).entries());
        calls?.push({
            url,
            method: init?.method ?? 'GET',
            headers,
            body: typeof init?.body === 'string' ? init.body : null,
        });

        if (url.startsWith(MOCK_ENDPOINTS.prover[0]!)) {
            if (proverResponse) return Promise.resolve(proverResponse());
            if (!proof) return Promise.resolve(new Response('prover down', { status: 503 }));

            return Promise.resolve(
                new Response(toResponseBody(proof), {
                    status: 200,
                    headers: { 'content-type': 'application/octet-stream' },
                }),
            );
        }

        const base = [MOCK_ENDPOINTS.beaconApi[0]!, MOCK_ENDPOINTS.checkpointz[0]!].find(
            candidate => url.startsWith(candidate),
        );
        if (!base || !beaconDirectory) {
            return Promise.resolve(new Response('not found', { status: 404 }));
        }

        const file = path.join(
            beaconDirectory,
            toFixtureFileName(url.slice(base.length).replace(/^\/+/, ''), headers.accept ?? null),
        );
        if (!fs.existsSync(file))
            return Promise.resolve(new Response('no fixture', { status: 404 }));

        return Promise.resolve(
            new Response(toResponseBody(new Uint8Array(fs.readFileSync(file))), { status: 200 }),
        );
    };
