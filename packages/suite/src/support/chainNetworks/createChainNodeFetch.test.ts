import { createChainNodeFetch } from './createChainNodeFetch';

describe(createChainNodeFetch.name, () => {
    const response = { ok: true } as Response;

    it('asks once per host to be let through, then fetches', async () => {
        const fetch = jest.fn().mockResolvedValue(response);
        const allowHost = jest.fn().mockResolvedValue(true);
        const nodeFetch = createChainNodeFetch({ fetch, allowHost });

        await nodeFetch('https://rpc.example.com/a', { method: 'POST' });
        await nodeFetch('https://rpc.example.com/b');
        await nodeFetch(new URL('https://other.example.com/'));

        expect(allowHost.mock.calls).toEqual([['rpc.example.com'], ['other.example.com']]);
        expect(fetch).toHaveBeenCalledWith('https://rpc.example.com/a', { method: 'POST' });
        expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('does not fetch from a host the app refused, and asks again next time', async () => {
        const fetch = jest.fn().mockResolvedValue(response);
        const allowHost = jest
            .fn()
            .mockRejectedValueOnce(new Error('ipc failed'))
            .mockResolvedValueOnce(true);
        const nodeFetch = createChainNodeFetch({ fetch, allowHost });

        await expect(nodeFetch('https://rpc.example.com/')).rejects.toThrow(
            'The app does not allow requests to rpc.example.com.',
        );
        expect(fetch).not.toHaveBeenCalled();

        await nodeFetch('https://rpc.example.com/');

        expect(allowHost).toHaveBeenCalledTimes(2);
        expect(fetch).toHaveBeenCalledTimes(1);
    });
});
