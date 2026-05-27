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

    it('returns INCORRECT-OUTPUT when changeAddress.address is not a valid Bitcoin address', () => {
        const tx = composeTx({
            utxos: [
                {
                    vout: 0,
                    txid: '0000000000000000000000000000000000000000000000000000000000000000',
                    coinbase: false,
                    own: true,
                    confirmations: 100,
                    amount: '50000',
                },
            ],
            outputs: [{ type: 'send-max-noaddress' }],
            feeRate: 10,
            network: NETWORKS.bitcoin,
            changeAddress: { address: 'not-a-valid-address' },
            dustThreshold: 546,
            sortingStrategy: 'bip69',
        });

        expect(tx).toEqual({
            type: 'error',
            error: 'INCORRECT-OUTPUT',
            message: 'not-a-valid-address has no matching Script',
        });
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
                },
            ],
            outputs: [
                {
                    type: 'payment',
                    address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
                    amount: 'not-a-number',
                },
            ],
            feeRate: 10,
            network: NETWORKS.bitcoin,
            changeAddress: { address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT' },
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
