import { address, isJsonRpcPayload } from '@solana/kit';
import type {
    Base64EncodedWireTransaction,
    Rpc,
    RpcTransport,
    SolanaRpcApiMainnet,
} from '@solana/kit';

import type { SolanaAPI } from '../types';
import { serializedLegacyTx } from './__fixtures__/signing.fixture';
import { createRpcFromTransport, getApi, selectSolanaConnection } from './api';
import { getFees } from './fees';

const URL = 'https://solana.rpc.test';
const ADDRESS = address('11111111111111111111111111111111');

const mockFetch = () => {
    const requests: string[] = [];
    jest.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
        const body = String(init?.body);
        requests.push(body);

        return Promise.resolve(
            new Response(JSON.stringify({ jsonrpc: '2.0', id: JSON.parse(body).id, result: null })),
        );
    });

    return requests;
};

const sendRequests = (rpc: Rpc<SolanaRpcApiMainnet>) =>
    Promise.all([
        rpc.getMultipleAccounts([ADDRESS], { encoding: 'base64' }).send(),
        rpc.getBalance(ADDRESS).send(),
        rpc.getSignaturesForAddress(ADDRESS, { limit: 1 }).send(),
        rpc.getLatestBlockhash().send(),
        rpc.sendTransaction('AA==' as Base64EncodedWireTransaction, { encoding: 'base64' }).send(),
    ]);

describe('solana rpc commitment', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it.each([
        ['getApi', () => getApi(URL, 'test').rpc],
        ['selectSolanaConnection', () => selectSolanaConnection(URL, 'test')],
    ])('%s sends no request with confirmed commitment', async (_, createRpc) => {
        const requests = mockFetch();

        await sendRequests(createRpc());

        expect(requests).toHaveLength(5);
        requests.forEach(request => expect(request).not.toContain('confirmed'));
    });
});

describe('solana rpc commitment on a mock transport', () => {
    it('estimates fees without overriding the finalized server default', async () => {
        const rpcResults: Record<string, unknown> = {
            simulateTransaction: {
                context: { slot: 1 },
                value: { err: null, unitsConsumed: 1000 },
            },
            getRecentPrioritizationFees: [],
            getFeeForMessage: { context: { slot: 1 }, value: 5000 },
        };
        const params: Record<string, unknown[]> = {};
        const transport: RpcTransport = <TResponse>({ payload }: Parameters<RpcTransport>[0]) => {
            if (!isJsonRpcPayload(payload) || !(payload.method in rpcResults)) {
                return Promise.reject(new Error('Unexpected RPC request'));
            }
            params[payload.method] = payload.params as unknown[];

            return Promise.resolve({
                jsonrpc: '2.0',
                result: rpcResults[payload.method],
            } as TResponse);
        };
        const api = { rpc: createRpcFromTransport(transport) } as unknown as SolanaAPI;

        await getFees(serializedLegacyTx, undefined, api);

        expect(Object.keys(params)).toEqual(Object.keys(rpcResults));
        // kit drops `finalized` from the request as it is the RPC server default
        expect(JSON.stringify(params)).not.toContain('commitment');
    });
});
