import { createCoseFixtures } from './cose.fixture';
import { createCose } from '../src/runtime/exports';

describe('cardano createCose', () => {
    createCoseFixtures.forEach(f => {
        it(`encodes COSE_Sign1 / COSE_Key matching the CIP-0008 golden vectors: ${f.description}`, () => {
            expect(createCose(f.payload, f.signature, f.address, f.pubKey)).toEqual(f.result);
        });
    });
});
