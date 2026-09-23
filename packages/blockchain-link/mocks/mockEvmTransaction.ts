import type { TransactionLegacy } from 'viem';

export const mockEvmTransaction = (tx: Partial<TransactionLegacy> = {}): TransactionLegacy => ({
    hash: '0xf1b9c2ff1a0ca2c9e2b30f66f0dfe0ec2e8f1cdbd4a5be7d8e9f0a1b2c3d4e5f',
    from: '0x1111111111111111111111111111111111111111',
    to: '0x2222222222222222222222222222222222222222',
    value: 10n,
    gas: 21000n,
    gasPrice: 3n,
    nonce: 7,
    input: '0x',
    blockNumber: 42n,
    blockHash: '0x3333333333333333333333333333333333333333333333333333333333333333',
    transactionIndex: 0,
    type: 'legacy',
    typeHex: '0x0',
    chainId: 1,
    r: '0x1',
    s: '0x1',
    v: 37n,
    ...tx,
});
