import fs from 'fs/promises';
import { join } from 'path';

import { COIN_IMAGE_SIZES, ICONS_URL_BASE, createCoinImageName } from '../../src/coinImages';
import { FILES_CRYPTOICONS_PATH, YIELD_VAULTS_URL } from '../constants';

jest.mock('fs/promises', () => ({
    writeFile: jest.fn(),
}));

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

// `createHttpClient` captures `globalThis.fetch` when the module under test is first evaluated, so
// the mock above has to be installed before that happens — hence the require instead of a top-level
// import, which would be hoisted above the assignment.
const { downloadVaultIcons } = require('./downloadVaultIcons') as {
    downloadVaultIcons: () => Promise<void>;
};

const ETH_WETH_VAULT = '0x704cfb08969048a8dff298b214f959791d8da509';
const ETH_USDT_VAULT = '0xe4db1c5a1b709ce4d2ada6985d9d506e58f73829';
const BASE_WETH_VAULT = '0x4edc6ab1964e25eb2c202ab9f201e9548baa53df';
const BASE_USDC_VAULT = '0x5e6fc406960a1c2d9ab6813ff1c914c6836bc53e';

// Underlying tokens; the WETH ones are the wrapped-native contracts from @suite-common/wallet-config.
const ETH_WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const BASE_WETH = '0x4200000000000000000000000000000000000006';
const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const ETH_USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

type FakeResponseInit = { status?: number; json?: unknown; buffer?: ArrayBuffer };

const fakeResponse = ({ status = 200, json, buffer }: FakeResponseInit): Response => {
    const response = {
        ok: status >= 200 && status < 300,
        status,
        statusText: status === 200 ? 'OK' : 'Not Found',
        headers: new Headers({ 'content-type': json ? 'application/json' : 'image/webp' }),
        json: () => Promise.resolve(json),
        text: () => Promise.resolve(json ? JSON.stringify(json) : ''),
        arrayBuffer: () => Promise.resolve(buffer ?? new ArrayBuffer(0)),
        clone: () => fakeResponse({ status, json, buffer }),
    };

    return response as unknown as Response;
};

const vault = ({
    address,
    underlyingToken,
    coingeckoId,
}: {
    address: string;
    underlyingToken: string;
    coingeckoId: string;
}) => ({ yieldId: `vault-${address}`, address, underlyingToken, coingeckoId });

const iconUrl = (coingeckoId: string, size: (typeof COIN_IMAGE_SIZES)[number]) =>
    `${ICONS_URL_BASE}/${createCoinImageName({ coingeckoId, size })}`;

const sourceIconRoutes = (coingeckoId: string) =>
    Object.fromEntries(
        COIN_IMAGE_SIZES.map(size => [
            iconUrl(coingeckoId, size),
            fakeResponse({ buffer: new Uint8Array([size]).buffer }),
        ]),
    );

const vaultListRoute = (vaults: Record<string, unknown[]>) => ({
    [YIELD_VAULTS_URL]: fakeResponse({ json: vaults }),
});

// up-fetch hands `fetch` a Request instance rather than a URL string.
const urlOf = (input: unknown) =>
    typeof input === 'object' && input !== null && 'url' in input
        ? String((input as Request).url)
        : String(input);

const mockFetchRoutes = (routes: Record<string, Response>) => {
    fetchMock.mockImplementation((input: unknown) =>
        Promise.resolve(routes[urlOf(input)] ?? fakeResponse({ status: 404 })),
    );
};

const writtenFiles = () => (fs.writeFile as jest.Mock).mock.calls.map(([path]) => String(path));

const requestedUrls = () => fetchMock.mock.calls.map(([input]) => urlOf(input));

describe('downloadVaultIcons', () => {
    let consoleErrorSpy: jest.SpyInstance;
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        consoleLogSpy.mockRestore();
    });

    it('writes the underlying icon under the vault address file name in every size', async () => {
        mockFetchRoutes({
            ...vaultListRoute({
                ethereum: [
                    vault({
                        address: ETH_USDT_VAULT,
                        underlyingToken: ETH_USDT,
                        coingeckoId: 'tether',
                    }),
                ],
            }),
            ...sourceIconRoutes('tether'),
        });

        await downloadVaultIcons();

        for (const size of COIN_IMAGE_SIZES) {
            expect(fs.writeFile).toHaveBeenCalledWith(
                join(FILES_CRYPTOICONS_PATH, `ethereum--${ETH_USDT_VAULT}@${size}.webp`),
                Buffer.from([size]),
            );
        }
        expect(fs.writeFile).toHaveBeenCalledTimes(COIN_IMAGE_SIZES.length);
    });

    it('substitutes the native coin icon when the underlying is the wrapped native token', async () => {
        mockFetchRoutes({
            ...vaultListRoute({
                ethereum: [
                    vault({
                        address: ETH_WETH_VAULT,
                        underlyingToken: ETH_WETH,
                        coingeckoId: 'weth',
                    }),
                ],
            }),
            ...sourceIconRoutes('ethereum'),
        });

        await downloadVaultIcons();

        // The WETH icon must never be requested — the vault reads as ETH.
        expect(requestedUrls()).toContain(iconUrl('ethereum', 24));
        expect(requestedUrls()).not.toContain(iconUrl('weth', 24));
        expect(writtenFiles()).toContain(
            join(FILES_CRYPTOICONS_PATH, `ethereum--${ETH_WETH_VAULT}@24.webp`),
        );
    });

    it('resolves an L2 wrapped-native underlying to the settlement layer native coin', async () => {
        mockFetchRoutes({
            ...vaultListRoute({
                base: [
                    vault({
                        address: BASE_WETH_VAULT,
                        underlyingToken: BASE_WETH,
                        coingeckoId: 'l2-standard-bridged-weth-base',
                    }),
                ],
            }),
            ...sourceIconRoutes('ethereum'),
        });

        await downloadVaultIcons();

        expect(requestedUrls()).toContain(iconUrl('ethereum', 24));
        expect(requestedUrls()).not.toContain(iconUrl('l2-standard-bridged-weth-base', 24));
        expect(writtenFiles()).toContain(
            join(FILES_CRYPTOICONS_PATH, `base--${BASE_WETH_VAULT}@24.webp`),
        );
    });

    it('keeps the underlying coin id for a non-wrapped underlying on the same platform', async () => {
        mockFetchRoutes({
            ...vaultListRoute({
                base: [
                    vault({
                        address: BASE_USDC_VAULT,
                        underlyingToken: BASE_USDC,
                        coingeckoId: 'usd-coin',
                    }),
                ],
            }),
            ...sourceIconRoutes('usd-coin'),
        });

        await downloadVaultIcons();

        expect(requestedUrls()).toContain(iconUrl('usd-coin', 24));
        expect(writtenFiles()).toContain(
            join(FILES_CRYPTOICONS_PATH, `base--${BASE_USDC_VAULT}@24.webp`),
        );
    });

    it('lowercases the vault address in the written file name', async () => {
        mockFetchRoutes({
            ...vaultListRoute({
                base: [
                    vault({
                        address: BASE_USDC_VAULT.toUpperCase().replace('0X', '0x'),
                        underlyingToken: BASE_USDC,
                        coingeckoId: 'usd-coin',
                    }),
                ],
            }),
            ...sourceIconRoutes('usd-coin'),
        });

        await downloadVaultIcons();

        expect(writtenFiles()).toContain(
            join(FILES_CRYPTOICONS_PATH, `base--${BASE_USDC_VAULT}@24.webp`),
        );
    });

    it('skips and reports a platform with no known network, still processing the rest', async () => {
        mockFetchRoutes({
            ...vaultListRoute({
                'brand-new-chain': [
                    vault({
                        address: '0xabc',
                        underlyingToken: '0xdef',
                        coingeckoId: 'usd-coin',
                    }),
                ],
                ethereum: [
                    vault({
                        address: ETH_USDT_VAULT,
                        underlyingToken: ETH_USDT,
                        coingeckoId: 'tether',
                    }),
                ],
            }),
            ...sourceIconRoutes('tether'),
        });

        await downloadVaultIcons();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('brand-new-chain'),
            expect.anything(),
        );
        expect(fs.writeFile).toHaveBeenCalledTimes(COIN_IMAGE_SIZES.length);
        expect(writtenFiles().every(path => path.includes('ethereum--'))).toBe(true);
    });

    it('skips sizes whose source icon is not published and writes the remaining ones', async () => {
        const routes: Record<string, Response> = {
            ...vaultListRoute({
                ethereum: [
                    vault({
                        address: ETH_USDT_VAULT,
                        underlyingToken: ETH_USDT,
                        coingeckoId: 'tether',
                    }),
                ],
            }),
            ...sourceIconRoutes('tether'),
        };
        delete routes[iconUrl('tether', 80)];

        mockFetchRoutes(routes);

        await downloadVaultIcons();

        expect(fs.writeFile).toHaveBeenCalledTimes(COIN_IMAGE_SIZES.length - 1);
        expect(writtenFiles()).not.toContain(
            join(FILES_CRYPTOICONS_PATH, `ethereum--${ETH_USDT_VAULT}@80.webp`),
        );
        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('downloads each source rendition once when several vaults share an underlying', async () => {
        mockFetchRoutes({
            ...vaultListRoute({
                ethereum: [
                    vault({
                        address: ETH_WETH_VAULT,
                        underlyingToken: ETH_WETH,
                        coingeckoId: 'weth',
                    }),
                ],
                base: [
                    vault({
                        address: BASE_WETH_VAULT,
                        underlyingToken: BASE_WETH,
                        coingeckoId: 'l2-standard-bridged-weth-base',
                    }),
                ],
            }),
            ...sourceIconRoutes('ethereum'),
        });

        await downloadVaultIcons();

        // Both vaults resolve to native ETH: one vault-list request plus one per source size.
        expect(fetchMock).toHaveBeenCalledTimes(1 + COIN_IMAGE_SIZES.length);
        expect(fs.writeFile).toHaveBeenCalledTimes(2 * COIN_IMAGE_SIZES.length);
    });

    it('throws when the vault list cannot be fetched', async () => {
        mockFetchRoutes({});

        await expect(downloadVaultIcons()).rejects.toThrow();
        expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('throws when the vault list does not match the expected schema', async () => {
        mockFetchRoutes(vaultListRoute({ ethereum: [{ yieldId: 'missing-fields' }] }));

        await expect(downloadVaultIcons()).rejects.toThrow();
        expect(fs.writeFile).not.toHaveBeenCalled();
    });
});
