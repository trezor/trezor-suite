import { createViemEvmJsonRpcClient } from './createViemEvmJsonRpcClient';

const rpcResult = (result: unknown) =>
    new Response(JSON.stringify({ jsonrpc: '2.0', id: 0, result }), {
        headers: { 'Content-Type': 'application/json' },
    });

describe(createViemEvmJsonRpcClient.name, () => {
    it('sends JSON-RPC through the app’s fetch and decodes the answer', async () => {
        const fetch = jest.fn((_url: string, init: RequestInit) => {
            const { method, id } = JSON.parse(String(init.body));

            return Promise.resolve(
                new Response(
                    JSON.stringify({
                        jsonrpc: '2.0',
                        id,
                        result: method === 'eth_chainId' ? '0xdef1' : '0x14d1120d7b160000',
                    }),
                    { headers: { 'Content-Type': 'application/json' } },
                ),
            );
        });
        const client = createViemEvmJsonRpcClient({ fetch: fetch as never })([
            'https://rpc.example',
        ]);

        await expect(client.getChainId()).resolves.toBe(57073);
        await expect(client.getBalance('0x' + '1'.repeat(40))).resolves.toBe(1500000000000000000n);
        expect(fetch).toHaveBeenCalledWith('https://rpc.example/', expect.anything());
    });

    it('falls back to the next node when one fails', async () => {
        const fetch = jest
            .fn()
            .mockRejectedValueOnce(new Error('down'))
            .mockRejectedValueOnce(new Error('down'))
            .mockResolvedValue(rpcResult('0x1'));
        const client = createViemEvmJsonRpcClient({ fetch })([
            'https://a.example',
            'https://b.example',
        ]);

        await expect(client.getChainId()).resolves.toBe(1);
        expect(fetch).toHaveBeenLastCalledWith('https://b.example/', expect.anything());
    });
});
