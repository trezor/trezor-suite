import { isCodesignBuild } from '@trezor/env-utils';

import { fetchRankedTokenDefinitions } from './fetchRankedTokenDefinitions';
import { type RankedTokenStructure } from './tokenDefinitionsTypes';

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isCodesignBuild: jest.fn(),
}));

const definitions: RankedTokenStructure = [
    {
        assetPlatformId: 'ethereum',
        address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        symbol: 'usdt',
        name: 'Tether',
        marketCap: 100,
    },
    {
        assetPlatformId: 'solana',
        address: 'So11111111111111111111111111111111111111112',
        symbol: 'wsol',
        name: 'Wrapped SOL',
        marketCap: 0,
    },
];

describe('fetchRankedTokenDefinitions', () => {
    const fetchMock = jest.spyOn(global, 'fetch');

    beforeEach(() => {
        fetchMock.mockReset();
        jest.mocked(isCodesignBuild).mockReturnValue(false);
    });

    afterAll(() => {
        fetchMock.mockRestore();
    });

    it.each([
        { isCodesign: false, environment: 'develop' },
        { isCodesign: true, environment: 'stable' },
    ])(
        'loads the fixed $environment URL and preserves catalogue order',
        async ({ isCodesign, environment }) => {
            jest.mocked(isCodesignBuild).mockReturnValue(isCodesign);
            fetchMock.mockResolvedValue(Response.json(definitions));

            const result: RankedTokenStructure = await fetchRankedTokenDefinitions();

            expect(fetchMock).toHaveBeenCalledWith(
                `https://data.trezor.io/suite/definitions/${environment}/ranked.coin.definitions.v1.json`,
                { signal: undefined },
            );
            expect(result).toEqual(definitions);
        },
    );

    it('forwards cancellation to the request', async () => {
        const controller = new AbortController();
        fetchMock.mockImplementation(
            (_, options) =>
                new Promise((_, reject) => {
                    options?.signal?.addEventListener('abort', () =>
                        reject(new DOMException('Aborted', 'AbortError')),
                    );
                }),
        );

        const request = fetchRankedTokenDefinitions({ signal: controller.signal });
        controller.abort();

        await expect(request).rejects.toMatchObject({ name: 'AbortError' });
        expect(fetchMock).toHaveBeenCalledWith(expect.any(String), { signal: controller.signal });
    });

    it('rejects an HTTP failure', async () => {
        fetchMock.mockResolvedValue(new Response(null, { status: 404, statusText: 'Not Found' }));

        await expect(fetchRankedTokenDefinitions()).rejects.toThrow('404');
    });

    it('rejects malformed JSON', async () => {
        fetchMock.mockResolvedValue(new Response('invalid JSON'));

        await expect(fetchRankedTokenDefinitions()).rejects.toThrow();
    });

    it.each([
        null,
        {},
        [],
        [null],
        [{ ...definitions[0], address: undefined }],
        [{ ...definitions[0], symbol: 1 }],
        [{ ...definitions[0], marketCap: -1 }],
        [{ ...definitions[0], marketCap: null }],
    ])('rejects an invalid catalogue: %j', async data => {
        fetchMock.mockResolvedValue(Response.json(data));

        await expect(fetchRankedTokenDefinitions()).rejects.toThrow(
            'Invalid ranked token definitions',
        );
    });
});
