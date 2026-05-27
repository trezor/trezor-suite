import { createCoseFixtures } from '../__fixtures__/cardanoCose';
import { createCose } from '../cardanoUtils';

describe('cardano createCose', () => {
    createCoseFixtures.forEach(f => {
        it(`encodes COSE_Sign1 / COSE_Key matching the CIP-0008 golden vectors: ${f.description}`, () => {
            expect(createCose(f.payload, f.signature, f.address, f.pubKey)).toEqual(f.result);
        });
    });
});
