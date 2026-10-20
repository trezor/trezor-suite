import { encodeAbiParameters, encodeFunctionData, parseAbi, parseAbiParameters } from 'viem';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import TrezorConnect from '@trezor/connect';
import { MULTICALL3_ADDRESS } from '@trezor/network-ethereum/constants';

import { type EvmReadCall, createEvmRead } from './evmRead';

const ERC20_ABI = parseAbi([
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
]);

const TOKEN = '0x1111111111111111111111111111111111111111' as const;
const OTHER_TOKEN = '0x2222222222222222222222222222222222222222' as const;
const OWNER = '0x3333333333333333333333333333333333333333';

const encodeUint = (value: bigint) => encodeAbiParameters(parseAbiParameters('uint256'), [value]);

const encodeAggregate3 = (entries: { success: boolean; returnData: `0x${string}` }[]) =>
    encodeAbiParameters(parseAbiParameters('(bool success, bytes returnData)[]'), [entries]);

const balanceCall: EvmReadCall = {
    to: TOKEN,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [OWNER],
};

const decimalsCall: EvmReadCall = { to: OTHER_TOKEN, abi: ERC20_ABI, functionName: 'decimals' };

const rpcCallMock = jest.spyOn(TrezorConnect, 'blockchainEvmRpcCall');

const ok = (data: string) => ({ success: true as const, payload: { data } });
const failed = (code: string) => ({
    success: false as const,
    error: { code, message: 'rpc error with the descriptor 0xsecret' },
});

const read = createEvmRead({ symbol: asNetworkSymbol('eth'), from: OWNER, identity: '0' });

beforeEach(() => {
    jest.clearAllMocks();
});

afterAll(() => {
    jest.restoreAllMocks();
});

describe('createEvmRead one', () => {
    it('encodes the call, sends it from the account and decodes the typed result', async () => {
        rpcCallMock.mockResolvedValue(ok(encodeUint(42n)) as never);

        const result = await read.one({
            to: TOKEN,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [OWNER],
        });

        expect(result).toEqual({ success: true, value: 42n });
        expect(rpcCallMock).toHaveBeenCalledWith({
            coin: 'eth',
            identity: '0',
            from: OWNER,
            to: TOKEN,
            data: encodeFunctionData({ abi: ERC20_ABI, functionName: 'balanceOf', args: [OWNER] }),
        });
    });

    it('sends pre-encoded calldata as is', async () => {
        rpcCallMock.mockResolvedValue(ok(encodeUint(1n)) as never);
        const data = '0x70a08231000000000000000000000000ffffffffffffffffffffffffffffffffffffffff';

        await read.one({ to: TOKEN, abi: ERC20_ABI, functionName: 'balanceOf', data });

        expect(rpcCallMock.mock.calls[0]?.[0]).toMatchObject({ data });
    });

    it('reports a failed call by its error code only', async () => {
        rpcCallMock.mockResolvedValue(failed('Method_Unknown') as never);

        await expect(read.one(balanceCall)).resolves.toEqual({
            success: false,
            errorName: 'Method_Unknown',
        });
    });

    it('reports an empty answer', async () => {
        rpcCallMock.mockResolvedValue(ok('0x') as never);

        await expect(read.one(balanceCall)).resolves.toEqual({
            success: false,
            errorName: 'EmptyResult',
        });
    });

    it('reports an answer that does not decode', async () => {
        rpcCallMock.mockResolvedValue(ok('0x1234') as never);

        const result = await read.one(balanceCall);

        expect(result.success).toBe(false);
        expect(result.success === false && result.errorName).toMatch(/Error$/);
    });

    it('reports a thrown error by its name', async () => {
        rpcCallMock.mockRejectedValue(new TypeError('network is down at https://secret.rpc'));

        await expect(read.one(balanceCall)).resolves.toEqual({
            success: false,
            errorName: 'TypeError',
        });
    });

    it('gives up after the timeout', async () => {
        jest.useFakeTimers();
        rpcCallMock.mockReturnValue(new Promise(() => {}) as never);
        const slowRead = createEvmRead({
            symbol: asNetworkSymbol('eth'),
            from: OWNER,
            timeoutMs: 50,
        });

        const pending = slowRead.one(balanceCall);
        await jest.advanceTimersByTimeAsync(50);

        await expect(pending).resolves.toEqual({
            success: false,
            errorName: 'EvmReadTimeoutError',
        });
        jest.useRealTimers();
    });
});

describe('createEvmRead many', () => {
    it('returns nothing for no calls without touching the chain', async () => {
        await expect(read.many([])).resolves.toEqual([]);
        expect(rpcCallMock).not.toHaveBeenCalled();
    });

    it('reads a single call directly', async () => {
        rpcCallMock.mockResolvedValue(ok(encodeUint(7n)) as never);

        await expect(read.many([balanceCall])).resolves.toEqual([{ success: true, value: 7n }]);
        expect(rpcCallMock.mock.calls[0]?.[0]).toMatchObject({ to: TOKEN });
    });

    it('batches several calls through Multicall3 and decodes each result', async () => {
        rpcCallMock.mockResolvedValue(
            ok(
                encodeAggregate3([
                    { success: true, returnData: encodeUint(5n) },
                    { success: false, returnData: '0x' },
                ]),
            ) as never,
        );

        const results = await read.many([balanceCall, decimalsCall]);

        expect(results).toEqual([
            { success: true, value: 5n },
            { success: false, errorName: 'CallReverted' },
        ]);
        expect(rpcCallMock).toHaveBeenCalledTimes(1);
        expect(rpcCallMock.mock.calls[0]?.[0]).toMatchObject({ to: MULTICALL3_ADDRESS });
    });

    it('falls back to one request per call when the aggregate call fails', async () => {
        rpcCallMock
            .mockResolvedValueOnce(failed('Method_Unknown') as never)
            .mockResolvedValueOnce(ok(encodeUint(5n)) as never)
            .mockResolvedValueOnce(ok(encodeUint(18n)) as never);

        const results = await read.many([balanceCall, decimalsCall]);

        expect(results).toEqual([
            { success: true, value: 5n },
            { success: true, value: 18 },
        ]);
        expect(rpcCallMock).toHaveBeenCalledTimes(3);
        expect(rpcCallMock.mock.calls.slice(1).map(([params]) => params.to)).toEqual([
            TOKEN,
            OTHER_TOKEN,
        ]);
    });

    it('falls back to one request per call when the aggregate answer does not decode', async () => {
        rpcCallMock
            .mockResolvedValueOnce(ok('0x1234') as never)
            .mockResolvedValueOnce(ok(encodeUint(5n)) as never)
            .mockResolvedValueOnce(ok(encodeUint(18n)) as never);

        const results = await read.many([balanceCall, decimalsCall]);

        expect(results.every(result => result.success)).toBe(true);
        expect(rpcCallMock).toHaveBeenCalledTimes(3);
    });
});
