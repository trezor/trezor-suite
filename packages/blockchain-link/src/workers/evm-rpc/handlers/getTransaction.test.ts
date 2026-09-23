import { TransactionReceiptNotFoundError } from 'viem';

import type { MessageTypes } from '@trezor/blockchain-link-types';

import type { Request } from '../types';
import { getTransaction } from './getTransaction';

const txid = '0xf1b9c2ff1a0ca2c9e2b30f66f0dfe0ec2e8f1cdbd4a5be7d8e9f0a1b2c3d4e5f';

const minedTx = {
    hash: txid,
    from: '0x1111111111111111111111111111111111111111',
    to: '0x2222222222222222222222222222222222222222',
    value: 10n,
    gas: 21000n,
    gasPrice: 3n,
    nonce: 7,
    input: '0x',
    blockNumber: 42n,
    blockHash: '0x3333333333333333333333333333333333333333333333333333333333333333',
};

const pendingTx = { ...minedTx, blockNumber: null, blockHash: null };

type FakeClient = {
    getTransaction: jest.Mock;
    getTransactionReceipt: jest.Mock;
    getBlock: jest.Mock;
};

const createRequest = (client: FakeClient) =>
    ({
        payload: { txid },
        connect: () => Promise.resolve(client),
    }) as unknown as Request<MessageTypes.GetTransaction>;

describe('evm-rpc getTransaction', () => {
    it('returns a broadcast transaction that is not mined yet', async () => {
        const client: FakeClient = {
            getTransaction: jest.fn().mockResolvedValue(pendingTx),
            getTransactionReceipt: jest
                .fn()
                .mockRejectedValue(new TransactionReceiptNotFoundError({ hash: txid })),
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
                .mockResolvedValue({ gasUsed: 20000n, status: 'success' }),
            getBlock: jest.fn().mockResolvedValue({ timestamp: 1700000000n }),
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
