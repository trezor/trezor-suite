import { getAddress } from 'viem';

import type { SignedEthereumSweepRecord } from './ethereumSweepLedger';
import { evaluateEthereumSweepStatus, loadEthereumSweepStatus } from './ethereumSweepStatus';
import { mockHistoryTransaction } from '../../mocks/mockAccountInfo';
import { mockBackend } from '../../mocks/mockBackend';
import type { EthereumAddressInfo } from '../ethereum/ethereumAccountInfo';
import { getEthereumAddressPath } from '../ethereum/ethereumChain';

const ADDRESS = getAddress('0xd8da6bf26964af9d7eed9e03e53415d37aa96045');

const TXID = `0x${'ab'.repeat(32)}` as const;

const record: SignedEthereumSweepRecord = {
    hex: '0xf86c',
    txid: TXID,
    plan: {
        account: {
            chain: 'ethereum',
            slip44: 60,
            index: 0,
            path: getEthereumAddressPath(60, 0),
            address: ADDRESS,
        },
        chainId: 1,
        nonce: 4,
        balance: '1000000000000000000',
        gasPrice: '24000000000',
        gasLimit: '21000',
        fee: '504000000000000',
        amount: '999496000000000000',
        destination: { address: getAddress('0x70997970c51812dc3a010c7d01b50e0d17dc79c8') },
    },
};

const info = (overrides: Partial<EthereumAddressInfo> = {}): EthereumAddressInfo => ({
    balance: '0',
    nonce: '5',
    transactions: 2,
    unconfirmedTransactions: 0,
    tokens: [],
    isEmpty: false,
    ...overrides,
});

const minedTransaction = (status: number) =>
    mockHistoryTransaction({
        txid: TXID,
        blockHeight: 20_000_000,
        ethereumSpecific: { status, nonce: 4, gasLimit: 21000, gasUsed: 21000 },
    });

describe('evaluateEthereumSweepStatus', () => {
    it('is confirmed when the transaction is mined and succeeded', () => {
        expect(
            evaluateEthereumSweepStatus({
                transaction: minedTransaction(1),
                info: info(),
                plan: record.plan,
            }),
        ).toBe('confirmed');
    });

    it('is failed when the transaction is mined but reverted', () => {
        expect(
            evaluateEthereumSweepStatus({
                transaction: minedTransaction(0),
                info: info(),
                plan: record.plan,
            }),
        ).toBe('failed');
    });

    it.each([-1, 0, undefined])('is pending while the block height is %s', blockHeight => {
        expect(
            evaluateEthereumSweepStatus({
                transaction: mockHistoryTransaction({ txid: TXID, blockHeight }),
                info: info({ unconfirmedTransactions: 1, nonce: '4' }),
                plan: record.plan,
            }),
        ).toBe('pending');
    });

    it('is not in the mempool when the backend does not know it and the nonce is unused', () => {
        expect(evaluateEthereumSweepStatus({ info: info({ nonce: '4' }), plan: record.plan })).toBe(
            'not-in-mempool',
        );
    });

    it.each([
        ['the nonce moved on', info({ nonce: '5' })],
        ['something is pending', info({ nonce: '4', unconfirmedTransactions: 1 })],
        ['the backend reports no nonce', info({ nonce: undefined })],
    ])('is unknown when the backend does not know it and %s', (_description, addressInfo) => {
        expect(evaluateEthereumSweepStatus({ info: addressInfo, plan: record.plan })).toBe(
            'unknown',
        );
    });
});

describe('loadEthereumSweepStatus', () => {
    it('combines the transaction lookup with the address state', async () => {
        const chain = mockBackend();
        const backend = chain.backend.ethereum.ethereum;
        chain.setEthereumAccountInfo('ethereum', ADDRESS, { misc: { nonce: '4' } });

        expect(await loadEthereumSweepStatus({ backend, record })).toEqual({
            success: true,
            payload: 'not-in-mempool',
        });

        chain.ethereumTransactions.set(TXID, minedTransaction(1));
        expect(await loadEthereumSweepStatus({ backend, record })).toEqual({
            success: true,
            payload: 'confirmed',
        });
    });

    it('fails when the address state cannot be read', async () => {
        const chain = mockBackend();
        const backend = chain.backend.ethereum.ethereum;
        backend.getAccountInfo.mockResolvedValue({
            success: false,
            error: { type: 'backend', message: 'offline' },
        });

        expect(await loadEthereumSweepStatus({ backend, record })).toEqual({
            success: false,
            error: { type: 'backend', message: 'offline' },
        });
    });
});
