import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type AccountTransaction } from '@trezor/connect';

type TransactionInput = AccountTransaction['details']['vin'][number];
type TransactionOutput = AccountTransaction['details']['vout'][number];

// Public test vectors of BIP173 and of the addresses of utxo-lib.
const OWN_ADDRESS = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
const FOREIGN_ADDRESS = '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH';

export const UNRESOLVED_TXID = 'cc'.repeat(32);

export const accountWithUnresolvedInputs = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    descriptor: asAccountDescriptor('zpubWithUnresolvedInputs'),
    addresses: {
        change: [],
        used: [
            {
                address: OWN_ADDRESS,
                path: "m/84'/0'/0'/0/0",
                transfers: 2,
                balance: '0',
                sent: '0',
                received: '0',
            },
        ],
        unused: [],
    },
});

const ownInput: TransactionInput = {
    txid: 'aa'.repeat(32),
    vout: 0,
    sequence: 4294967293,
    n: 0,
    addresses: [OWN_ADDRESS],
    isAddress: true,
    isAccountOwned: true,
    value: '5000',
};

// The Electrum backend doesn't fetch the previous transaction of an input which isn't the account's.
const unresolvedForeignInput: TransactionInput = {
    txid: 'bb'.repeat(32),
    vout: 1,
    sequence: 4294967293,
    n: 1,
    addresses: [],
    isAddress: false,
};

export const resolvedForeignInput: TransactionInput = {
    ...unresolvedForeignInput,
    addresses: [FOREIGN_ADDRESS],
    isAddress: true,
    value: '20000',
};

const outputs: TransactionOutput[] = [
    { n: 0, addresses: [FOREIGN_ADDRESS], isAddress: true, value: '15000' },
    { n: 1, addresses: [OWN_ADDRESS], isAddress: true, isAccountOwned: true, value: '9000' },
];

type GetUnresolvedTransactionParams = {
    blockHeight?: number;
};

/**
 * A replaceable transaction spending an output of the account together with a foreign output,
 * as the Electrum backend gives it in the history of the account.
 */
export const getUnresolvedTransaction = ({
    blockHeight = -1,
}: GetUnresolvedTransactionParams = {}): AccountTransaction => ({
    type: 'joint',
    txid: UNRESOLVED_TXID,
    hex: '0200',
    blockHeight,
    blockTime: blockHeight > 0 ? 1700000000 : undefined,
    blockHash: blockHeight > 0 ? 'dd'.repeat(32) : undefined,
    amount: '4000',
    fee: '0',
    feeRate: '0',
    vsize: 200,
    rbf: true,
    targets: [],
    tokens: [],
    internalTransfers: [],
    details: {
        vin: [ownInput, unresolvedForeignInput],
        vout: outputs,
        size: 250,
        totalInput: '5000',
        totalOutput: '24000',
    },
});

export const RESOLVED_FEE = '1000';

/** The same transaction as the backend gives it without an account, with all its input values. */
export const getFullTransaction = (): AccountTransaction => ({
    ...getUnresolvedTransaction(),
    type: 'unknown',
    amount: '24000',
    fee: RESOLVED_FEE,
    feeRate: '5',
    details: {
        vin: [{ ...ownInput, isAccountOwned: undefined }, resolvedForeignInput],
        vout: outputs.map(output => ({ ...output, isAccountOwned: undefined })),
        size: 250,
        totalInput: '25000',
        totalOutput: '24000',
    },
});
