import { TransactionReceiptNotFoundError } from 'viem';

import type { MessageTypes } from '@trezor/blockchain-link-types';

import { mockEvmBlock } from '../../../../mocks/mockEvmBlock';
import { mockEvmTransaction } from '../../../../mocks/mockEvmTransaction';
import { mockEvmTransactionReceipt } from '../../../../mocks/mockEvmTransactionReceipt';
import type { Request } from '../types';
import { getTransaction } from './getTransaction';

const minedTx = mockEvmTransaction();
const pendingTx = mockEvmTransaction({
    blockNumber: null,
    blockHash: null,
    transactionIndex: null,
});

type FakeClient = {
    getTransaction: jest.Mock;
    getTransactionReceipt: jest.Mock;
    getBlock: jest.Mock;
};

const createRequest = (client: FakeClient) =>
    ({
        payload: { txid: minedTx.hash },
        connect: () => Promise.resolve(client),
    }) as unknown as Request<MessageTypes.GetTransaction>;

describe('evm-rpc getTransaction', () => {
    it('returns a broadcast transaction that is not mined yet', async () => {
        const client: FakeClient = {
            getTransaction: jest.fn().mockResolvedValue(pendingTx),
            getTransactionReceipt: jest
                .fn()
                .mockRejectedValue(new TransactionReceiptNotFoundError({ hash: minedTx.hash })),
            getBlock: jest.fn(),
        };

        const { payload } = await getTransaction(createRequest(client));

        expect(client.getBlock).not.toHaveBeenCalled();
        expect(payload.blockHeight).toBe(0);
        expect(payload.blockTime).toBe(0);
        // Gas limit * gas price, the most the transaction can cost.
        expect(payload.fee).toBe('63000');
        expect(payload.ethereumSpecific).toMatchObject({ status: -1, nonce: 7, gasLimit: 21000 });
        expect(payload.ethereumSpecific?.gasUsed).toBeUndefined();
    });

    it('returns a mined transaction with the data from its receipt and block', async () => {
        const client: FakeClient = {
            getTransaction: jest.fn().mockResolvedValue(minedTx),
            getTransactionReceipt: jest
                .fn()
                .mockResolvedValue(mockEvmTransactionReceipt({ gasUsed: 20000n })),
            getBlock: jest.fn().mockResolvedValue(mockEvmBlock({ timestamp: 1700000000n })),
        };

        const { payload } = await getTransaction(createRequest(client));

        expect(client.getBlock).toHaveBeenCalledWith({ blockNumber: 42n });
        expect(payload.blockHeight).toBe(42);
        expect(payload.blockTime).toBe(1700000000);
        expect(payload.fee).toBe('60000');
        expect(payload.ethereumSpecific).toMatchObject({ status: 1, gasUsed: 20000 });
    });

    it('does not swallow a receipt lookup failing for another reason', async () => {
        const client: FakeClient = {
            getTransaction: jest.fn().mockResolvedValue(minedTx),
            getTransactionReceipt: jest.fn().mockRejectedValue(new Error('backend is down')),
            getBlock: jest.fn(),
        };

        await expect(getTransaction(createRequest(client))).rejects.toThrow('backend is down');
    });
});
