import { getRandomInt } from '@trezor/utils';

import { verifyTxBytes } from './compose.utils';
import { composeTx } from '../src/compose';
import { CHANGE_ADDRESS, composeTxFixture } from './__fixtures__/compose';
import { fixturesCrossCheck } from './__fixtures__/compose.crosscheck';
import { INPUT_SCRIPT_LENGTH, OUTPUT_SCRIPT_LENGTH } from '../src/coinselect/coinselectUtils';
import { getErrorResult } from '../src/compose/result';
import { bip69SortingStrategy } from '../src/compose/sorting/bip69SortingStrategy';

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
        it(f.description, () => {
            mockRandomInt(f.randomIntSequence);

            const tx = composeTx(f.request);
            expect(tx).toEqual(f.result);

            expect(f.request.txType).not.toEqual('p2wsh');

            if (tx.type === 'final' && f.request.txType !== 'p2wsh') {
                verifyTxBytes(tx, f.request.txType);
            }
        });
    });
});

describe('composeTx request validation errors', () => {
    it('returns MISSING-UTXOS when utxos array is empty', () => {
        const tx = composeTx({
            utxos: [],
            outputs: [
                { type: 'send-max-noaddress', script: { length: OUTPUT_SCRIPT_LENGTH.p2pkh } },
            ],
            feeRate: 10,
            changeAddress: CHANGE_ADDRESS,
            dustThreshold: 546,
            sortingStrategy: 'bip69',
        });

        expect(tx).toEqual({ type: 'error', error: 'MISSING-UTXOS' });
    });

    it('returns INCORRECT-OUTPUT when a payment output has an unparseable amount', () => {
        const tx = composeTx({
            utxos: [
                {
                    vout: 0,
                    txid: '0000000000000000000000000000000000000000000000000000000000000000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    amount: '50000',
                    script: { length: INPUT_SCRIPT_LENGTH.p2pkh },
                },
            ],
            outputs: [
                {
                    ...CHANGE_ADDRESS,
                    type: 'payment',
                    amount: 'not-a-number',
                },
            ],
            feeRate: 10,
            changeAddress: CHANGE_ADDRESS,
            dustThreshold: 546,
            sortingStrategy: 'bip69',
        });

        expect(tx).toEqual({
            type: 'error',
            error: 'INCORRECT-OUTPUT',
            message: 'Invalid amount at index 0',
        });
    });

    it('returns the validateAndParseRequest error result directly (does not enter coinselect)', () => {
        const tx = composeTx({
            utxos: [
                {
                    vout: 0,
                    txid: '0000000000000000000000000000000000000000000000000000000000000000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    amount: '50000',
                    script: { length: INPUT_SCRIPT_LENGTH.p2pkh },
                },
            ],
            outputs: [
                { type: 'send-max-noaddress', script: { length: OUTPUT_SCRIPT_LENGTH.p2pkh } },
            ],
            feeRate: 0,
            changeAddress: CHANGE_ADDRESS,
            dustThreshold: 546,
            sortingStrategy: 'bip69',
        });

        expect(tx).toEqual({ type: 'error', error: 'INCORRECT-FEE-RATE' });
    });
});

describe('getErrorResult', () => {
    it('maps a thrown Error whose message matches a COMPOSE_ERROR_TYPES entry to the typed error object (no message field)', () => {
        expect(getErrorResult(new Error('NOT-ENOUGH-FUNDS'))).toEqual({
            type: 'error',
            error: 'NOT-ENOUGH-FUNDS',
        });
    });

    it('stringifies a non-Error thrown value and routes unknown messages to the COINSELECT branch with a message field', () => {
        expect(getErrorResult('unexpected failure')).toEqual({
            type: 'error',
            error: 'COINSELECT',
            message: 'unexpected failure',
        });
    });
});

describe('bip69SortingStrategy', () => {
    it('falls back to script.length comparison when at least one output script is not a Buffer', () => {
        const value = 1000n;
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
            changeAddress: CHANGE_ADDRESS,
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
    const addrScriptLengths = {
        p2pkh: OUTPUT_SCRIPT_LENGTH.p2pkh,
        p2sh: OUTPUT_SCRIPT_LENGTH.p2sh,
        p2tr: OUTPUT_SCRIPT_LENGTH.p2tr,
        p2wpkh: OUTPUT_SCRIPT_LENGTH.p2wpkh,
        p2wsh: OUTPUT_SCRIPT_LENGTH.p2wsh,
    };

    const amounts = {
        p2pkh: '102300',
        p2sh: '101500',
        p2tr: '101500',
        p2wpkh: '101500',
        p2wsh: '101500',
    };

    const addrKeys = Object.keys(addrScriptLengths) as Array<keyof typeof addrScriptLengths>;

    fixturesCrossCheck.forEach(f => {
        txTypes.forEach(txType => {
            const offset = f.request.outputs.find(o => 'address' in o && o.address === 'replace-me')
                ? addrKeys.length
                : 1;

            addrKeys.slice(0, offset).forEach(addressType => {
                const key = `${txType}-${addressType}` as keyof typeof f.result;
                it(`${key} ${f.description}`, () => {
                    const resolvedOutputs = f.request.outputs.map(o => {
                        if (o.type === 'payment') {
                            const scriptLength =
                                o.address in addrScriptLengths
                                    ? addrScriptLengths[o.address as keyof typeof addrScriptLengths]
                                    : addrScriptLengths[addressType];

                            return {
                                ...o,
                                script: { length: scriptLength },
                            };
                        }

                        if (o.type === 'opreturn') {
                            return {
                                ...o,
                                script: { length: 2 + o.dataHex.length / 2 },
                            };
                        }

                        return {
                            ...o,
                            script: { length: OUTPUT_SCRIPT_LENGTH[txType] },
                        };
                    });

                    const tx = composeTx({
                        ...f.request,
                        txType,
                        utxos: f.request.utxos.map(utxo => ({
                            ...utxo,
                            amount: utxo.amount === 'replace-me' ? amounts[txType] : utxo.amount,
                            script: { length: INPUT_SCRIPT_LENGTH[txType] },
                        })),
                        changeAddress: {
                            ...f.request.changeAddress,
                            script: { length: addrScriptLengths[txType] },
                        },
                        outputs: resolvedOutputs,
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
