import {
    type Account,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/blockchain-link-types';

import { buildFakePendingEvmTx } from '../transactionsThunks';

const ACCOUNT_ADDRESS = '0x1111111111111111111111111111111111111111';
const OTHER_ADDRESS = '0x2222222222222222222222222222222222222222';
const CONTRACT_ADDRESS = '0x3333333333333333333333333333333333333333';

const account = {
    descriptor: ACCOUNT_ADDRESS,
    deviceState: 'state@device:0',
    symbol: 'eth',
    networkType: 'ethereum',
} as Account;

const token: TokenInfo = {
    type: 'ERC20',
    standard: 'ERC20',
    contract: CONTRACT_ADDRESS,
    name: 'Token',
    symbol: 'TKN',
    decimals: 18,
};

const buildParams = (toAddress: string) => ({
    precomposedTransaction: {
        outputs: [{ address: toAddress, amount: '1000000000000000000' }],
        fee: '21000',
        feeLimit: '21000',
        maxFeePerGas: '20',
        maxPriorityFeePerGas: '2',
    } as unknown as PrecomposedTransactionFinal,
    precomposedForm: {
        transactionData: '0xa9059cbb',
    } as unknown as FormState,
    txid: '0xdeadbeef',
    account,
    nonce: '5',
    blockHeight: 100,
    deadline: 10,
    token,
});

describe('buildFakePendingEvmTx', () => {
    it('marks a token transfer to a different address as "sent"', () => {
        const tx = buildFakePendingEvmTx(buildParams(OTHER_ADDRESS));

        expect(tx.tokens?.[0]?.type).toBe('sent');
    });

    it('marks a token transfer to the own account as "self" so the amount is hidden', () => {
        const tx = buildFakePendingEvmTx(buildParams(ACCOUNT_ADDRESS));

        expect(tx.tokens?.[0]?.type).toBe('self');
    });

    it('detects a self-transfer regardless of address casing', () => {
        const tx = buildFakePendingEvmTx(buildParams(ACCOUNT_ADDRESS.toUpperCase()));

        expect(tx.tokens?.[0]?.type).toBe('self');
    });
});
