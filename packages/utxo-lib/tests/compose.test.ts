import BN from 'bn.js';

import { getRandomInt } from '@trezor/utils';

import { verifyTxBytes } from './compose.utils';
import { composeTx } from '../src/compose';
import { composeTxFixture } from './__fixtures__/compose';
import { fixturesCrossCheck } from './__fixtures__/compose.crosscheck';
import { getErrorResult } from '../src/compose/result';
import { bip69SortingStrategy } from '../src/compose/sorting/bip69SortingStrategy';
import * as NETWORKS from '../src/networks';

jest.mock('@trezor/utils', () => ({
    ...jest.requireActual('@trezor/utils'),
    getRandomInt: jest.fn(),
}));

const mockRandomInt = (randomIntSequence: number[] | undefined) => {
    let fakeRandomIndex = 0;
    (getRandomInt as jest.Mock).mockImplementation(() => {
        if (randomIntSequence === undefined || fakeRandomIndex >= randomIntSequence.length) {
            throw new Error(`Not enough random numbers provided (i: ${fakeRandomIndex})`);
        }

        return randomIntSequence?.[fakeRandomIndex++];
    });
};

describe(composeTx.name, () => {
    composeTxFixture.forEach(f => {
        const network = f.request.network ?? NETWORKS.bitcoin;
        const request = { ...f.request, network };
        const result = { ...f.result };

        it(f.description, () => {
            mockRandomInt(f.randomIntSequence);

            const tx = composeTx(request);
            expect(tx).toEqual(result);

            expect(f.request.txType).not.toEqual('p2wsh');

            if (tx.type === 'final' && f.request.txType !== 'p2wsh') {
                verifyTxBytes(tx, f.request.txType, network);
            }
        });
    });
});

describe('composeTx request validation errors', () => {
    it('returns MISSING-UTXOS when utxos array is empty', () => {
        // validateAndParseUtxos at src/compose/request.ts:74 short-circuits with
        // { type: 'error', error: 'MISSING-UTXOS' } when utxos.length === 0. The
        // existing fixture set never exercises this — every compose fixture has at
        // least one utxo. Use a positive feeRate so validateAndParseFeeRate succeeds
        // and execution reaches validateAndParseUtxos. A mutator that flipped the
        // empty-check (e.g., utxos.length !== 0) would route the call into the
        // for-loop, which iterates zero times and returns [] — that path then
        // proceeds to validateAndParseOutputs and produces a different error shape,
        // distinguishable by exact toEqual.
        const tx = composeTx({
            utxos: [],
            outputs: [{ type: 'send-max-noaddress' }],
            feeRate: 10,
            network: NETWORKS.bitcoin,
            changeAddress: { address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT' },
            dustThreshold: 546,
            sortingStrategy: 'bip69',
        });

        expect(tx).toEqual({ type: 'error', error: 'MISSING-UTXOS' });
    });

    it('returns the validateAndParseRequest error result directly (does not enter coinselect)', () => {
        // feeRate=0 is rejected by validateAndParseFeeRate (request.ts), so
        // validateAndParseRequest returns { type: 'error', error: 'INCORRECT-FEE-RATE' }.
        // composeTx must short-circuit and return that exact object — if the
        // 'error' in coinselectRequest branch is skipped, the error object would
        // instead be passed into coinselect() and surface as a COINSELECT-typed error.
        const tx = composeTx({
            utxos: [
                {
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    amount: '50000',
                },
            ],
            outputs: [{ type: 'send-max-noaddress' }],
            feeRate: 0,
            network: NETWORKS.bitcoin,
            changeAddress: { address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT' },
            dustThreshold: 546,
            sortingStrategy: 'bip69',
        });

        expect(tx).toEqual({ type: 'error', error: 'INCORRECT-FEE-RATE' });
    });
});

describe('getErrorResult', () => {
    it('maps a thrown Error whose message matches a COMPOSE_ERROR_TYPES entry to the typed error object (no message field)', () => {
        // getErrorResult is reached only via composeTx's try/catch when something
        // inside coinselect throws. Test it directly: an Error('NOT-ENOUGH-FUNDS')
        // should be classified as a known error (via the COMPOSE_ERROR_TYPES.find
        // lookup) and returned as { type: 'error', error: 'NOT-ENOUGH-FUNDS' } —
        // notably WITHOUT the `message` field that the unknown-error branch adds.
        // Any mutation that flips `if (known)` to false would route this Error to
        // the COINSELECT branch and produce a `message` field, which exact-equal
        // detects.
        expect(getErrorResult(new Error('NOT-ENOUGH-FUNDS'))).toEqual({
            type: 'error',
            error: 'NOT-ENOUGH-FUNDS',
        });
    });

    it('stringifies a non-Error thrown value and routes unknown messages to the COINSELECT branch with a message field', () => {
        // Drives the two remaining branches in getErrorResult that the Error
        // happy-path test does not reach:
        //   - the ternary's non-Error arm: `error instanceof Error ? ... : \`${error}\``
        //     produces 'unexpected failure' for the bare string input
        //   - the `if (known)` false arm: 'unexpected failure' is NOT in
        //     COMPOSE_ERROR_TYPES, so the function falls through to the
        //     COINSELECT return statement that attaches the stringified message
        // A mutator that flips `if (known)` to true (or the ternary's condition)
        // would change the returned object shape — exact toEqual detects it.
        expect(getErrorResult('unexpected failure')).toEqual({
            type: 'error',
            error: 'COINSELECT',
            message: 'unexpected failure',
        });
    });
});

describe('bip69SortingStrategy', () => {
    it('falls back to script.length comparison when at least one output script is not a Buffer', () => {
        // outputComparator at src/compose/sorting/bip69SortingStrategy.ts:9 is:
        //   `a.value.cmp(b.value) || (Buffer.isBuffer(a.script) && Buffer.isBuffer(b.script)
        //     ? a.script.compare(b.script) : a.script.length - b.script.length)`.
        // Every existing fixture that reaches createTransaction has payment/send-max/opreturn
        // outputs whose script is built by toOutputScript / p2data — always a Buffer — so
        // the else (length-based) arm is never exercised. A change output that coinselect
        // appends DOES have a non-Buffer `{ length: N }` script, but no fixture happens to
        // produce two outputs with equal BN values to make the sort actually invoke the
        // ternary's right side. Drive it directly: equal values force the `||` to fall
        // through, and a non-Buffer script in one slot forces the else arm; the shorter
        // script must permute to position 0.
        const value = new BN(1000);
        const result = {
            inputs: [],
            outputs: [
                { value, script: Buffer.alloc(34, 0xff) }, // idx 0 — Buffer, length 34
                { value, script: { length: 22 } }, // idx 1 — non-Buffer, length 22 (shorter)
            ],
            fee: 0,
        };
        const request = {
            outputs: [{ type: 'payment', address: 'addr-a', amount: '1000' }],
            changeAddress: { address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT' },
        };

        const composed = bip69SortingStrategy({
            result: result as any,
            request: request as any,
            convertedInputs: [],
        });

        // idx 1 (non-Buffer, length 22) sorts before idx 0 (Buffer, length 34) by length.
        expect(composed.outputsPermutation).toEqual([1, 0]);
    });
});

describe('composeTx addresses cross-check', () => {
    const txTypes = ['p2pkh', 'p2sh', 'p2tr', 'p2wpkh'] as const;
    const addrTypes = {
        p2pkh: '1BitcoinEaterAddressDontSendf59kuE',
        p2sh: '3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr',
        p2tr: 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr',
        p2wpkh: 'bc1qafk4yhqvj4wep57m62dgrmutldusqde8adh20d',
        p2wsh: 'bc1q6rgl33d3s9dugudw7n68yrryajkr3ha9q8q24j20zs62se4q9tsqdy0t2q',
    };

    const amounts = {
        p2pkh: '102300',
        p2sh: '101500',
        p2tr: '101500',
        p2wpkh: '101500',
        p2wsh: '101500',
    };

    const addrKeys = Object.keys(addrTypes) as Array<keyof typeof addrTypes>;

    fixturesCrossCheck.forEach(f => {
        txTypes.forEach(txType => {
            // skip test for each addressType if there is nothing to replace (example: 7 inputs test)
            const offset = f.request.outputs.find(o => 'address' in o && o.address === 'replace-me')
                ? addrKeys.length
                : 1;

            addrKeys.slice(0, offset).forEach(addressType => {
                const key = `${txType}-${addressType}` as keyof typeof f.result;
                it(`${key} ${f.description}`, () => {
                    const tx = composeTx({
                        ...f.request,
                        network: NETWORKS.bitcoin,
                        txType,
                        utxos: f.request.utxos.map(utxo => ({
                            ...utxo,
                            amount: utxo.amount === 'replace-me' ? amounts[txType] : utxo.amount,
                        })),
                        changeAddress: { address: addrTypes[txType] },
                        outputs: f.request.outputs.map(o => {
                            if (o.type === 'payment') {
                                return {
                                    ...o,
                                    address:
                                        o.address === 'replace-me'
                                            ? addrTypes[addressType]
                                            : addrTypes[o.address as keyof typeof addrTypes] ||
                                              o.address,
                                };
                            }

                            return o;
                        }),
                    });

                    if (tx.type !== 'final') throw new Error('Not final transaction!');

                    if (f.result[key] === undefined) {
                        throw new Error(`Assert key ${key} not found in fixtures`);
                    }

                    expect(tx).toMatchObject(f.result[key]);

                    expect(tx.inputs.length).toEqual(f.request.utxos.length);

                    verifyTxBytes(tx, txType);
                });
            });
        });
    });
});
