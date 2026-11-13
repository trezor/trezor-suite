import * as fixtures from './__fixtures__/accountUtils';
import { isUtxoBased } from './accountUtils';

describe('utils/accountUtils', () => {
    describe('isUtxoBased', () => {
        fixtures.isUtxoBasedFixtures.forEach(f => {
            it(f.description, () => {
                expect(isUtxoBased(...f.input)).toEqual(f.output);
            });
        });
    });

    // todo:
    describe.skip('getPublicKeyLabel', () => {});
});
