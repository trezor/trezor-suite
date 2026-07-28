import { testMocks } from '@suite-common/test-utils';
import { getUtxoOutpoint } from '@suite-common/wallet-utils';

import { getExcludedUtxos } from './getExcludedUtxos';
const { getUtxo } = testMocks;

describe(getExcludedUtxos.name, () => {
    it('getExcludedUtxos', () => {
        const dustUtxo = getUtxo({
            address: 'two',
            amount: '1',
            vout: 1,
        });
        const lowAnonymityDustUtxo = getUtxo({
            address: 'one',
            amount: '100',
            vout: 2,
        });
        const lowAnonymityUtxo = getUtxo({
            address: 'one',
            amount: '1000',
            vout: 3,
        });
        const spendableUtxo = getUtxo({
            address: 'two',
            amount: '546',
            vout: 4,
        });

        const excludedUtxos = getExcludedUtxos({
            utxos: [dustUtxo, lowAnonymityDustUtxo, lowAnonymityUtxo, spendableUtxo],
            anonymitySet: { one: 1, two: 2 },
            targetAnonymity: 2,
            dustLimit: 546,
        });

        expect(excludedUtxos[getUtxoOutpoint(dustUtxo)]).toBe('dust');
        expect(excludedUtxos[getUtxoOutpoint(lowAnonymityDustUtxo)]).toBe('dust');
        expect(excludedUtxos[getUtxoOutpoint(lowAnonymityUtxo)]).toBe('low-anonymity');
        expect(excludedUtxos[getUtxoOutpoint(spendableUtxo)]).toBe(undefined);
    });
});
