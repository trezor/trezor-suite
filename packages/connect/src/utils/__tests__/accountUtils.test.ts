import { getAccountLabel, isUtxoBased } from '../accountUtils';

import * as fixtures from '../__fixtures__/accountUtils';

describe('utils/accountUtils', () => {
    describe('getAccountLabel', () => {
        fixtures.getAccountLabelFixtures.forEach(f => {
            it(f.description, () => {
                expect(getAccountLabel(...f.input)).toEqual(f.output);
            });
        });
    });
    describe('isUtxoBased', () => {
        fixtures.isUtxoBasedFixtures.forEach(f => {
            it(f.description, () => {
                expect(isUtxoBased(...f.input)).toEqual(f.output);
            });
        });
    });

    // todo:
    describe.skip('getAccountAddressN', () => {});
    describe.skip('getAccountLabel', () => {});
    describe.skip('getPublicKeyLabel', () => {});
});
