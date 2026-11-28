import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import { type AccountType, getAccountPath } from './accountType';
import {
    type VerifyPreviousTransactionsParams,
    verifyPreviousTransactions,
} from './verifyPreviousTransactions';
import { mockPreviousTransaction } from '../../mocks/mockPreviousTransaction';
import { mockWallet } from '../../mocks/mockWallet';

const wallet = mockWallet();

const INPUT_SCRIPT_TYPES = {
    p2pkh: 'SPENDADDRESS',
    p2sh: 'SPENDP2SHWITNESS',
    p2wpkh: 'SPENDWITNESS',
} as const;

type FundedInputParams = {
    accountType: AccountType;
    addressIndex?: number;
    amount?: string;
};

// An input together with the genuine previous transaction that funds it.
const fundedInput = ({ accountType, addressIndex = 0, amount = '50000' }: FundedInputParams) => {
    const previous = mockPreviousTransaction({
        outputs: [
            { script: Buffer.from('6a', 'hex'), value: '0' },
            { script: wallet.getScript({ accountType, addressIndex }), value: amount },
        ],
        nonce: addressIndex,
    });
    const input: PROTO.TxInputType = {
        address_n: [...getAccountPath(accountType, 0), 0, addressIndex],
        prev_hash: previous.txid,
        prev_index: 1,
        amount,
        script_type: INPUT_SCRIPT_TYPES[accountType],
        sequence: 0xffffffff,
    };

    return { input, previous };
};

type SetupParams = {
    accountType: AccountType;
    funded: ReturnType<typeof fundedInput>[];
};

const setup = ({ accountType, funded }: SetupParams): VerifyPreviousTransactionsParams => ({
    inputs: funded.map(({ input }) => input),
    previousTransactionHexes: new Map(funded.map(({ previous }) => [previous.txid, previous.hex])),
    accountType,
    accountPath: getAccountPath(accountType, 0),
    accountXpub: wallet.getAccountXpub(accountType),
});

describe('verifyPreviousTransactions', () => {
    it.each<AccountType>(['p2pkh', 'p2sh', 'p2wpkh'])(
        'accepts genuine previous transactions of a %s account',
        accountType => {
            const funded = [0, 1, 2].map(addressIndex =>
                fundedInput({ accountType, addressIndex }),
            );

            const result = verifyPreviousTransactions(setup({ accountType, funded }));

            expect(result.success).toBe(true);
            expect(
                result.success && result.payload.map(transaction => transaction.getId()),
            ).toEqual(funded.map(({ previous }) => previous.txid));
        },
    );

    it('returns a transaction funding several inputs only once', () => {
        const previous = mockPreviousTransaction({
            outputs: [0, 1].map(addressIndex => ({
                script: wallet.getScript({ accountType: 'p2pkh', addressIndex }),
                value: '7000',
            })),
        });
        const inputs = [0, 1].map((addressIndex): PROTO.TxInputType => ({
            address_n: [...getAccountPath('p2pkh', 0), 0, addressIndex],
            prev_hash: previous.txid,
            prev_index: addressIndex,
            amount: '7000',
            script_type: 'SPENDADDRESS',
        }));

        const result = verifyPreviousTransactions({
            inputs,
            previousTransactionHexes: new Map([[previous.txid, previous.hex]]),
            accountType: 'p2pkh',
            accountPath: getAccountPath('p2pkh', 0),
            accountXpub: wallet.getAccountXpub('p2pkh'),
        });

        expect(result.success && result.payload).toHaveLength(1);
    });

    it('rejects a previous transaction that does not hash to prev_hash', () => {
        const genuine = fundedInput({ accountType: 'p2wpkh', amount: '50000' });
        // The backend serves a different transaction that pays the same script far more.
        const forged = mockPreviousTransaction({
            outputs: [
                { script: Buffer.from('6a', 'hex'), value: '0' },
                { script: wallet.getScript({ accountType: 'p2wpkh' }), value: '90000000' },
            ],
        });
        const params = setup({ accountType: 'p2wpkh', funded: [genuine] });

        expect(
            verifyPreviousTransactions({
                ...params,
                inputs: [{ ...genuine.input, amount: '90000000' }],
                previousTransactionHexes: new Map([[genuine.previous.txid, forged.hex]]),
            }),
        ).toEqual({ success: false, error: { type: 'hash-mismatch', inputIndex: 0 } });
    });

    it('rejects a legacy outpoint presented as a SegWit input', () => {
        // The output really pays the legacy script of the key, but the backend lists it as an
        // unspent output of the SegWit account, where the device would not check its amount.
        const previous = mockPreviousTransaction({
            outputs: [{ script: wallet.getScript({ accountType: 'p2pkh' }), value: '50000' }],
        });
        const input: PROTO.TxInputType = {
            address_n: [...getAccountPath('p2wpkh', 0), 0, 0],
            prev_hash: previous.txid,
            prev_index: 0,
            amount: '50000',
            script_type: 'SPENDWITNESS',
        };

        expect(
            verifyPreviousTransactions({
                inputs: [input],
                previousTransactionHexes: new Map([[previous.txid, previous.hex]]),
                accountType: 'p2wpkh',
                accountPath: getAccountPath('p2wpkh', 0),
                accountXpub: wallet.getAccountXpub('p2wpkh'),
            }),
        ).toEqual({ success: false, error: { type: 'script-mismatch', inputIndex: 0 } });
    });

    it('rejects an output that pays a different address of the same account', () => {
        const funded = fundedInput({ accountType: 'p2sh', addressIndex: 3 });
        const params = setup({ accountType: 'p2sh', funded: [funded] });

        expect(
            verifyPreviousTransactions({
                ...params,
                inputs: [{ ...funded.input, address_n: [...getAccountPath('p2sh', 0), 0, 4] }],
            }),
        ).toEqual({ success: false, error: { type: 'script-mismatch', inputIndex: 0 } });
    });

    it.each(['49999', '50001', '5000000'])(
        'rejects a declared amount of %s for an output worth 50000',
        amount => {
            const funded = fundedInput({ accountType: 'p2wpkh', amount: '50000' });
            const params = setup({ accountType: 'p2wpkh', funded: [funded] });

            expect(
                verifyPreviousTransactions({
                    ...params,
                    inputs: [{ ...funded.input, amount }],
                }),
            ).toEqual({ success: false, error: { type: 'amount-mismatch', inputIndex: 0 } });
        },
    );

    it('reports the position of the offending input', () => {
        const funded = [0, 1, 2].map(addressIndex =>
            fundedInput({ accountType: 'p2pkh', addressIndex }),
        );
        const params = setup({ accountType: 'p2pkh', funded });
        const inputs = params.inputs.with(2, { ...funded[2]!.input, amount: '1' });

        expect(verifyPreviousTransactions({ ...params, inputs })).toEqual({
            success: false,
            error: { type: 'amount-mismatch', inputIndex: 2 },
        });
    });

    it('rejects an input whose previous transaction was not delivered', () => {
        const funded = fundedInput({ accountType: 'p2pkh' });
        const params = setup({ accountType: 'p2pkh', funded: [funded] });

        expect(
            verifyPreviousTransactions({ ...params, previousTransactionHexes: new Map() }),
        ).toEqual({ success: false, error: { type: 'missing-transaction', inputIndex: 0 } });
    });

    it('rejects a previous transaction that cannot be parsed', () => {
        const funded = fundedInput({ accountType: 'p2pkh' });
        const params = setup({ accountType: 'p2pkh', funded: [funded] });

        expect(
            verifyPreviousTransactions({
                ...params,
                previousTransactionHexes: new Map([[funded.previous.txid, 'zz00']]),
            }),
        ).toEqual({ success: false, error: { type: 'unparsable-transaction', inputIndex: 0 } });
    });

    it('rejects an output index the previous transaction does not have', () => {
        const funded = fundedInput({ accountType: 'p2pkh' });
        const params = setup({ accountType: 'p2pkh', funded: [funded] });

        expect(
            verifyPreviousTransactions({
                ...params,
                inputs: [{ ...funded.input, prev_index: 2 }],
            }),
        ).toEqual({ success: false, error: { type: 'missing-output', inputIndex: 0 } });
    });

    it('rejects a script type that does not belong to the account type', () => {
        const funded = fundedInput({ accountType: 'p2pkh' });
        const params = setup({ accountType: 'p2pkh', funded: [funded] });

        expect(
            verifyPreviousTransactions({
                ...params,
                inputs: [{ ...funded.input, script_type: 'SPENDWITNESS' }],
            }),
        ).toEqual({ success: false, error: { type: 'unexpected-script-type', inputIndex: 0 } });
    });

    it.each([
        ['another account', [...getAccountPath('p2pkh', 1), 0, 0]],
        ['another purpose', [...getAccountPath('p2sh', 0), 0, 0]],
        ['a path that is too short', getAccountPath('p2pkh', 0)],
        ['a chain that is neither receive nor change', [...getAccountPath('p2pkh', 0), 2, 0]],
        ['a hardened address index', [...getAccountPath('p2pkh', 0), 0, 0x80000000]],
    ])('rejects an input path in %s', (_description, address_n) => {
        const funded = fundedInput({ accountType: 'p2pkh' });
        const params = setup({ accountType: 'p2pkh', funded: [funded] });

        expect(
            verifyPreviousTransactions({ ...params, inputs: [{ ...funded.input, address_n }] }),
        ).toEqual({ success: false, error: { type: 'unexpected-input-path', inputIndex: 0 } });
    });

    it('rejects the same outpoint used twice', () => {
        const funded = fundedInput({ accountType: 'p2pkh' });
        const params = setup({ accountType: 'p2pkh', funded: [funded, funded] });

        expect(verifyPreviousTransactions(params)).toEqual({
            success: false,
            error: { type: 'duplicate-input', inputIndex: 1 },
        });
    });

    it('rejects an account key that cannot be parsed', () => {
        const funded = fundedInput({ accountType: 'p2pkh' });
        const params = setup({ accountType: 'p2pkh', funded: [funded] });

        expect(verifyPreviousTransactions({ ...params, accountXpub: 'ypub-not-a-key' })).toEqual({
            success: false,
            error: { type: 'invalid-account-xpub' },
        });
    });
});
