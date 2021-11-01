import { composeTx } from '../src';
import { Permutation } from '../src/compose/permutation';
import { reverseBuffer } from '../src/bufferutils';
import * as NETWORKS from '../src/networks';

import fixtures from './__fixtures__/compose';
import fixturesCrossCheck from './__fixtures__/compose.crosscheck';

// keyof typeof NETWORKS;
const getNetwork = (name?: string) =>
    // @ts-ignore expression of type string can't be used to index type
    typeof name === 'string' && NETWORKS[name] ? NETWORKS[name] : NETWORKS.bitcoin;

describe('composeTx', () => {
    fixtures.forEach(f => {
        const { description } = f;
        const request = { ...f.request, network: getNetwork(f.request.network) };
        const result: any = { ...f.result };
        it(description, () => {
            if (result.transaction) {
                result.transaction.inputs.forEach((oinput: any) => {
                    const input = oinput;
                    input.hash = reverseBuffer(Buffer.from(input.REV_hash, 'hex'));
                    delete input.REV_hash;
                });
                const o = result.transaction.PERM_outputs;
                const sorted = JSON.parse(JSON.stringify(o.sorted));
                sorted.forEach((ss: any) => {
                    const s = ss;
                    if (s.opReturnData != null) {
                        s.opReturnData = Buffer.from(s.opReturnData);
                    }
                });
                result.transaction.outputs = new Permutation(sorted, o.permutation);
                delete result.transaction.PERM_outputs;
            }
            expect(composeTx(request as any)).toEqual(result);
        });
    });
});

describe('composeTx addresses cross-check', () => {
    const txTypes = ['p2pkh', 'p2sh', 'p2tr', 'p2wpkh'];
    const addrTypes = {
        p2pkh: '1BitcoinEaterAddressDontSendf59kuE',
        p2sh: '3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr',
        p2tr: 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr',
        p2wpkh: 'bc1qafk4yhqvj4wep57m62dgrmutldusqde8adh20d',
        p2wsh: 'bc1q6rgl33d3s9dugudw7n68yrryajkr3ha9q8q24j20zs62se4q9tsqdy0t2q',
    };
    fixturesCrossCheck.forEach(f => {
        txTypes.forEach(txType => {
            Object.keys(addrTypes).forEach(addressType => {
                const key = `${txType}-${addressType}`;
                it(`${key} ${f.description}`, () => {
                    expect(
                        composeTx({
                            ...f.request,
                            network: NETWORKS.bitcoin,
                            txType,
                            outputs: f.request.outputs.map(o => ({
                                ...o,
                                address:
                                    // @ts-ignore addressType is string
                                    o.address === 'replace-me' ? addrTypes[addressType] : o.address,
                            })),
                        } as any),
                        // @ts-ignore key is string
                    ).toMatchObject(f.result[key]);
                });
            });
        });
    });
});
