import type { SolanaAPI } from '../types';
import { serializedLegacyTx, serializedV1Tx, v1Message } from './__fixtures__/signing.fixture';
import { getFees } from './fees';
import { V1_NOT_SUPPORTED_MESSAGE } from './signing';

// Every fee helper needs the RPC, so reaching it at all means the guard let the transaction past.
const rpcReached = 'RPC reached';
const api = {
    get rpc(): never {
        throw new Error(rpcReached);
    },
} as unknown as SolanaAPI;

describe(getFees.name, () => {
    it.each([
        ['a serialized v1 transaction', serializedV1Tx],
        ['a bare v1 message', v1Message],
    ])('rejects %s before the RPC is touched', async (_name, tx) => {
        await expect(getFees(tx, undefined, api)).rejects.toThrow(V1_NOT_SUPPORTED_MESSAGE);
    });

    it('lets a supported version through to the RPC', async () => {
        await expect(getFees(serializedLegacyTx, undefined, api)).rejects.toThrow(rpcReached);
    });
});
