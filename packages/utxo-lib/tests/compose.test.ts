import { composeTx } from '../src';
import { convertFeeRate } from '../src/compose/composeUtils';
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
        const result: any = { ...f.result };
        it(f.description, () => {
            const tx = composeTx(request as any);
            expect(tx).toEqual(result);

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
                        changeAddress: addrTypes[txType],
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

                    expect(tx.transaction.inputs.length).toEqual(f.request.utxos.length);

                    verifyTxBytes(tx, txType);
                });
            });
        });
    });
});

describe('composeUtils', () => {
    it('convertFeeRate', () => {
        // valid
        expect(convertFeeRate('1')).toEqual(1);
        expect(convertFeeRate('1.1')).toEqual(1.1);
        expect(convertFeeRate(1)).toEqual(1);
        expect(convertFeeRate(1.1)).toEqual(1.1);

        // invalid
        expect(convertFeeRate(Number.MAX_SAFE_INTEGER + 1)).toBeUndefined();
        expect(convertFeeRate('9007199254740992')).toBeUndefined(); // Number.MAX_SAFE_INTEGER + 1 as string
        expect(convertFeeRate('-1')).toBeUndefined();
        expect(convertFeeRate('-1')).toBeUndefined();
        expect(convertFeeRate('aaa')).toBeUndefined();
        expect(convertFeeRate('')).toBeUndefined();
        expect(convertFeeRate(-1)).toBeUndefined();
        expect(convertFeeRate(0)).toBeUndefined();
        expect(convertFeeRate('0')).toBeUndefined();
        expect(convertFeeRate(NaN)).toBeUndefined();
        expect(convertFeeRate(Infinity)).toBeUndefined();
        // @ts-expect-error invalid arg
        expect(convertFeeRate()).toBeUndefined();
        // @ts-expect-error invalid arg
        expect(convertFeeRate(null)).toBeUndefined();
    });
});
