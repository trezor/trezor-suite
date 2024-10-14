import { composeTx } from '../src';
import * as NETWORKS from '../src/networks';

import { verifyTxBytes } from './compose.utils';
import fixtures from './__fixtures__/compose';
import fixturesCrossCheck from './__fixtures__/compose.crosscheck';

// keyof typeof NETWORKS;
const getNetwork = (name?: string) =>
    // @ts-expect-error expression of type string can't be used to index type
    typeof name === 'string' && NETWORKS[name] ? NETWORKS[name] : NETWORKS.bitcoin;

describe('composeTx', () => {
    fixtures.forEach(f => {
        const network = getNetwork(f.request.network);
        const request = { ...f.request, network };
        const expected = { ...f.result };
        it(f.description, () => {
            const tx = composeTx(request as any);

            const deRandomizedOutputs =
                'outputsPermutation' in tx
                    ? tx.outputs.map((_, i) => tx.outputs[tx.outputsPermutation.indexOf(i)])
                    : undefined;

            const subject = { ...tx, outputs: deRandomizedOutputs, outputsPermutation: undefined };
            if (subject.outputs === undefined) {
                delete subject.outputs;
            }

            if ('inputs' in tx) {
                tx.inputs.sort((a, b) =>
                    `${a.txid}:${a.vout}`.localeCompare(`${b.txid}:${b.vout}`),
                );
                expected.inputs?.sort((a, b) => a.txid.localeCompare(b.txid));
            }

            expect(subject).toEqual(expected);

            if (tx.type === 'final') {
                verifyTxBytes(tx, f.request.txType as any, network);
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
            const offset = f.request.outputs.find(o => o.address === 'replace-me')
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
                    } as any);

                    if (tx.type !== 'final') throw new Error('Not final transaction!');

                    expect(tx).toMatchObject(f.result[key]);

                    expect(tx.inputs.length).toEqual(f.request.utxos.length);

                    verifyTxBytes(tx, txType);
                });
            });
        });
    });
});
