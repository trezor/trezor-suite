import {
    HttpRequestError,
    type PublicClient,
    decodeAbiParameters,
    encodeAbiParameters,
    encodeFunctionData,
    parseAbiParameters,
} from 'viem';

import { type BatchCall, MULTICALL3_ADDRESS, batchRead } from './multicall';

const CONTRACT = '0x7a7f0b3c23C23a31cFcb0c44709be70d4D545c6e';
const OTHER_CONTRACT = '0x1111111111111111111111111111111111111111';
const ACCOUNT = '0x2222222222222222222222222222222222222222' as const;

const TEST_ABI = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ type: 'uint256' }],
    },
    {
        name: 'pair',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'uint256' }, { type: 'uint256' }],
    },
] as const;

const AGGREGATE3_RESULT = parseAbiParameters('(bool success, bytes returnData)[]');

const encodeUint = (value: bigint) => encodeAbiParameters(parseAbiParameters('uint256'), [value]);

const encodeAggregate3 = (entries: { success: boolean; returnData: `0x${string}` }[]) =>
    encodeAbiParameters(AGGREGATE3_RESULT, [entries]);

// Strips the 4-byte aggregate3 selector so the calls array can be inspected.
const decodeAggregate3Input = (data: `0x${string}`) => {
    const [calls] = decodeAbiParameters(
        parseAbiParameters('(address target, bool allowFailure, bytes callData)[]'),
        `0x${data.slice(10)}` as `0x${string}`,
    );

    return calls as readonly { target: string; allowFailure: boolean; callData: string }[];
};

const balanceOfCall = (address: `0x${string}`): BatchCall => ({
    address,
    abi: TEST_ABI as unknown as BatchCall['abi'],
    functionName: 'balanceOf',
    args: [ACCOUNT],
});

const createClient = ({ multicall3Deployed = true }: { multicall3Deployed?: boolean } = {}) => {
    const client = {
        getCode: jest.fn().mockResolvedValue(multicall3Deployed ? '0x6080604052' : '0x'),
        call: jest.fn(),
    };

    return { client, asPublicClient: client as unknown as PublicClient };
};

describe('batchRead', () => {
    it('sends one aggregate3 request carrying every call', async () => {
        const { client, asPublicClient } = createClient();
        client.call.mockResolvedValue({
            data: encodeAggregate3([
                { success: true, returnData: encodeUint(11n) },
                { success: true, returnData: encodeUint(22n) },
            ]),
        });

        const results = await batchRead(asPublicClient, [
            balanceOfCall(CONTRACT),
            balanceOfCall(OTHER_CONTRACT),
        ]);

        expect(client.call).toHaveBeenCalledTimes(1);

        const [{ to, data }] = client.call.mock.calls[0];
        expect(to).toBe(MULTICALL3_ADDRESS);

        const inner = decodeAggregate3Input(data);
        expect(inner).toHaveLength(2);
        expect(inner.map(c => c.target.toLowerCase())).toEqual([
            CONTRACT.toLowerCase(),
            OTHER_CONTRACT.toLowerCase(),
        ]);
        expect(inner.every(c => c.allowFailure)).toBe(true);

        expect(results).toEqual([11n, 22n]);
    });

    it('decodes multi-output functions as a tuple', async () => {
        const { client, asPublicClient } = createClient();
        client.call.mockResolvedValue({
            data: encodeAggregate3([
                {
                    success: true,
                    returnData: encodeAbiParameters(parseAbiParameters('uint256, uint256'), [
                        4n,
                        5n,
                    ]),
                },
            ]),
        });

        const [pair] = await batchRead(asPublicClient, [
            {
                address: CONTRACT,
                abi: TEST_ABI as unknown as BatchCall['abi'],
                functionName: 'pair',
            },
        ]);

        expect(pair).toEqual([4n, 5n]);
    });

    it('maps a reverting call to undefined without losing the batch', async () => {
        const { client, asPublicClient } = createClient();
        client.call.mockResolvedValue({
            data: encodeAggregate3([
                { success: false, returnData: '0x' },
                { success: true, returnData: encodeUint(7n) },
            ]),
        });

        const results = await batchRead(asPublicClient, [
            balanceOfCall(CONTRACT),
            balanceOfCall(OTHER_CONTRACT),
        ]);

        expect(results).toEqual([undefined, 7n]);
    });

    it('falls back to single calls when the aggregate3 request itself fails', async () => {
        const { client, asPublicClient } = createClient();
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        client.call
            .mockRejectedValueOnce(new Error('not an aggregate3 response'))
            .mockResolvedValue({ data: encodeUint(8n) });

        const results = await batchRead(asPublicClient, [
            balanceOfCall(CONTRACT),
            balanceOfCall(OTHER_CONTRACT),
        ]);

        expect(client.call).toHaveBeenCalledTimes(3);
        expect(client.call.mock.calls.slice(1).map(([{ to }]) => to)).toEqual([
            CONTRACT,
            OTHER_CONTRACT,
        ]);
        expect(results).toEqual([8n, 8n]);

        warn.mockRestore();
    });

    it('stops attempting to batch when the address does not answer as Multicall3', async () => {
        const { client, asPublicClient } = createClient();
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        client.call.mockResolvedValue({ data: '0xdeadbeef' });

        await batchRead(asPublicClient, [balanceOfCall(CONTRACT)]);
        const afterFirstRead = client.call.mock.calls.length;

        client.call.mockResolvedValue({ data: encodeUint(5n) });
        const results = await batchRead(asPublicClient, [
            balanceOfCall(CONTRACT),
            balanceOfCall(OTHER_CONTRACT),
        ]);

        // Retrying the doomed batch on every read would cost more requests than never batching.
        expect(
            client.call.mock.calls
                .slice(afterFirstRead)
                .every(([{ to }]) => to !== MULTICALL3_ADDRESS),
        ).toBe(true);
        expect(results).toEqual([5n, 5n]);

        warn.mockRestore();
    });

    it('keeps batching after a transient batch failure', async () => {
        const { client, asPublicClient } = createClient();
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        client.call.mockRejectedValueOnce(new Error('timeout')).mockResolvedValue({
            data: encodeAggregate3([{ success: true, returnData: encodeUint(6n) }]),
        });

        await batchRead(asPublicClient, [balanceOfCall(CONTRACT)]);
        const afterFirstRead = client.call.mock.calls.length;

        const results = await batchRead(asPublicClient, [balanceOfCall(CONTRACT)]);

        expect(client.call.mock.calls[afterFirstRead]?.[0].to).toBe(MULTICALL3_ADDRESS);
        expect(results).toEqual([6n]);

        warn.mockRestore();
    });

    it('logs the failure without the request it failed on', async () => {
        const { client, asPublicClient } = createClient();
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const rpcUrl = 'https://rpc.example/an-api-key';
        client.call
            .mockRejectedValueOnce(
                new HttpRequestError({
                    url: rpcUrl,
                    body: {
                        method: 'eth_call',
                        params: [
                            {
                                to: MULTICALL3_ADDRESS,
                                data: encodeFunctionData({
                                    abi: TEST_ABI,
                                    functionName: 'balanceOf',
                                    args: [ACCOUNT],
                                }),
                            },
                        ],
                    },
                }),
            )
            .mockResolvedValue({ data: encodeUint(1n) });

        await batchRead(asPublicClient, [balanceOfCall(CONTRACT)]);

        const logged = warn.mock.calls.flat().join(' ');
        expect(logged).toContain('HttpRequestError');
        // The account address reaches the RPC inside the calldata, so neither may be logged.
        expect(logged).not.toContain(ACCOUNT.slice(2));
        expect(logged).not.toContain(rpcUrl);

        warn.mockRestore();
    });

    it('falls back to one request per call when Multicall3 is absent', async () => {
        const { client, asPublicClient } = createClient({ multicall3Deployed: false });
        client.call.mockResolvedValue({ data: encodeUint(9n) });

        const results = await batchRead(asPublicClient, [
            balanceOfCall(CONTRACT),
            balanceOfCall(OTHER_CONTRACT),
        ]);

        expect(client.call).toHaveBeenCalledTimes(2);
        expect(client.call.mock.calls.map(([{ to }]) => to)).toEqual([CONTRACT, OTHER_CONTRACT]);
        expect(results).toEqual([9n, 9n]);
    });

    it('isolates failures in the fallback path', async () => {
        const { client, asPublicClient } = createClient({ multicall3Deployed: false });
        client.call
            .mockRejectedValueOnce(new Error('reverted'))
            .mockResolvedValueOnce({ data: encodeUint(3n) });

        const results = await batchRead(asPublicClient, [
            balanceOfCall(CONTRACT),
            balanceOfCall(OTHER_CONTRACT),
        ]);

        expect(results).toEqual([undefined, 3n]);
    });

    it('probes Multicall3 support once per client', async () => {
        const { client, asPublicClient } = createClient();
        client.call.mockResolvedValue({
            data: encodeAggregate3([{ success: true, returnData: encodeUint(1n) }]),
        });

        await batchRead(asPublicClient, [balanceOfCall(CONTRACT)]);
        await batchRead(asPublicClient, [balanceOfCall(CONTRACT)]);
        await batchRead(asPublicClient, [balanceOfCall(CONTRACT)]);

        expect(client.getCode).toHaveBeenCalledTimes(1);
        expect(client.call).toHaveBeenCalledTimes(3);
    });

    it('makes no request for an empty call list', async () => {
        const { client, asPublicClient } = createClient();

        await expect(batchRead(asPublicClient, [])).resolves.toEqual([]);

        expect(client.getCode).not.toHaveBeenCalled();
        expect(client.call).not.toHaveBeenCalled();
    });
});
