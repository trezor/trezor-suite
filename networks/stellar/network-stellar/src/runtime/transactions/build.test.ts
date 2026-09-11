import { StrKey } from '@stellar/stellar-sdk';

import { buildContractTokenTransferTransaction } from './build';
import { parseTransactionFromXDR } from './parse';
import { transformTransaction } from './transform';

const SENDER = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 3));
const RECIPIENT = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 4));
const TOKEN = StrKey.encodeContract(Buffer.alloc(32, 5));

const build = (amount: string) =>
    buildContractTokenTransferTransaction({
        descriptor: SENDER,
        sequence: '123456',
        fee: '200',
        contract: TOKEN,
        destination: RECIPIENT,
        amount,
    });

describe('buildContractTokenTransferTransaction', () => {
    it('builds the transfer as the only operation of the transaction', () => {
        const { operations } = build('4200000');

        // Stellar does not allow a host function alongside anything else, and connect rejects it
        expect(operations).toHaveLength(1);
        expect(operations[0]?.type).toBe('invokeHostFunction');
    });

    it('carries the contract, the function and both parties through to the device', () => {
        // The protobuf the device signs is built from the parsed XDR, so going through it is
        // what proves the built call is the call that gets approved.
        const [operation] = transformTransaction(
            parseTransactionFromXDR(build('4200000').toXdr(), false),
        ).operations;

        expect(operation).toMatchObject({
            type: 'invokeHostFunction',
            function: {
                invoke_contract: {
                    contract_address: TOKEN,
                    function_name: 'transfer',
                    args: [
                        { address: SENDER },
                        { address: RECIPIENT },
                        { i128: { hi: '0', lo: '4200000' } },
                    ],
                },
            },
        });
    });

    it('keeps an eighteen-decimal amount exact, where a double would not', () => {
        // 1.5 of an 18-decimal token: past 2^53, so anything that touches a number loses it
        const amount = '1500000000000000000';

        const [operation] = transformTransaction(
            parseTransactionFromXDR(build(amount).toXdr(), false),
        ).operations;

        const [, , transferred] = (operation as any).function.invoke_contract.args;
        expect(BigInt(transferred.i128.lo) + (BigInt(transferred.i128.hi) << 64n)).toBe(
            BigInt(amount),
        );
    });

    it('needs preparing before it can be signed', () => {
        // The footprint and resource fee only come from a simulation, and connect refuses a
        // Soroban transaction without them.
        expect(
            transformTransaction(parseTransactionFromXDR(build('1').toXdr(), false)),
        ).not.toHaveProperty('sorobanData');
    });
});
