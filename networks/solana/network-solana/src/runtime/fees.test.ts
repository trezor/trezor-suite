import type { SolanaAPI } from '../types';
import {
    serializedLegacyTx,
    serializedV1Tx,
    v1WithConfigMessage,
} from './__fixtures__/signing.fixture';
import { getFees } from './fees';

// Every fee helper needs the RPC, so reaching it at all means the transaction was estimated.
const rpcReached = 'RPC reached';
const api = {
    get rpc(): never {
        throw new Error(rpcReached);
    },
} as unknown as SolanaAPI;

describe(getFees.name, () => {
    it('reads the fees of a v1 transaction from its config without the RPC', async () => {
        const fees = await getFees(`${v1WithConfigMessage}${'00'.repeat(64)}`, undefined, api);

        expect(fees).toMatchObject({
            baseFee: BigInt(5000),
            priorityFee: { computeUnitPrice: '0', computeUnitLimit: '200000', fee: '12345' },
            accountCreationFee: BigInt(0),
            decompiledTransactionMessage: {
                feePayer: { address: 'GcUy7n96V4CLEupSJGAd2KbkR2bpmEfrBxpCzqy4Sfcr' },
            },
        });
    });

    it('reads a zero priority fee from a v1 transaction without config', async () => {
        const fees = await getFees(serializedV1Tx, undefined, api);

        expect(fees.priorityFee).toEqual({
            computeUnitPrice: '0',
            computeUnitLimit: '0',
            fee: '0',
        });
    });

    it('estimates the fees of a legacy transaction with the RPC', async () => {
        await expect(getFees(serializedLegacyTx, undefined, api)).rejects.toThrow(rpcReached);
    });
});
