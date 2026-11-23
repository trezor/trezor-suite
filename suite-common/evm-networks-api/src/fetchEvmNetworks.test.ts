import { fetchEvmNetworks, getEvmNetworksUrl } from './fetchEvmNetworks';

const body = {
    generatedAt: '2026-11-18T00:00:00.000Z',
    networks: [
        {
            caip2: 'eip155:146',
            name: 'Sonic',
            nativeCurrency: { symbol: 'S', name: 'Sonic', decimals: 18 },
            networkType: 'mainnet',
            rpcUrls: ['https://rpc.soniclabs.com'],
            mayClearSign: false,
            simulationSupport: false,
        },
    ],
};

const mockFetchResponse = (response: Response) =>
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(response);

describe(fetchEvmNetworks.name, () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('fetches and parses the networks', async () => {
        const fetchSpy = mockFetchResponse(Response.json(body));
        const { signal } = new AbortController();

        await expect(fetchEvmNetworks({ signal })).resolves.toEqual(body);
        expect(fetchSpy).toHaveBeenCalledWith(getEvmNetworksUrl(), {
            signal,
            credentials: 'omit',
            referrerPolicy: 'no-referrer',
        });
        expect(getEvmNetworksUrl()).toMatch(/^https:\/\/.+\/api\/v2\/evm-networks$/);
    });

    it('rejects a failed response', async () => {
        mockFetchResponse(new Response(null, { status: 503 }));

        await expect(fetchEvmNetworks()).rejects.toThrow('Failed to fetch EVM networks: 503');
    });

    it('rejects a body of another shape', async () => {
        mockFetchResponse(Response.json({ networks: [] }));

        await expect(fetchEvmNetworks()).rejects.toThrow(/^Invalid EVM networks:.*generatedAt/s);
    });
});
