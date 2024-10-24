import { composeTx } from '../src/compose';
import * as NETWORKS from '../src/networks';

import { verifyTxBytes } from './compose.utils';
import { composeTxFixture } from './__fixtures__/compose';
import { fixturesCrossCheck } from './__fixtures__/compose.crosscheck';

import { getRandomInt } from '@trezor/utils';

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
