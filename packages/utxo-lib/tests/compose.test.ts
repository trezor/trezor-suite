import { composeTx } from '../src';
import { Permutation } from '../src/compose/permutation';
import { reverseBuffer } from '../src/bufferutils';
import * as NETWORKS from '../src/networks';

import fixtures from './__fixtures__/compose';

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
