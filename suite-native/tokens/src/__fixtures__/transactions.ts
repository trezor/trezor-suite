import { asAccountDescriptor } from '@suite-common/wallet-types';

import { type WalletAccountTransaction } from '../types';

export const mockTransaction: WalletAccountTransaction = {
    descriptor: asAccountDescriptor('test-descriptor'),
    deviceState: 'test-device@test:0',
    symbol: 'eth',
    type: 'recv',
    txid: 'test-txid',
    blockTime: 1700000000,
    blockHeight: 100,
    amount: '0',
    fee: '0',
    targets: [],
    tokens: [],
    internalTransfers: [],
    details: { vin: [], vout: [], size: 0, totalInput: '0', totalOutput: '0' },
} as unknown as WalletAccountTransaction;
