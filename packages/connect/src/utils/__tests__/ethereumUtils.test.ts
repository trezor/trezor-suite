import * as fixtures from '../__fixtures__/ethereumUtils';
import { getNetworkLabel } from '../ethereumUtils';

describe('utils/ethereumUtils', () => {
    describe('getNetworkLabel', () => {
        fixtures.getNetworkLabelFixtures.forEach(f => {
            it(f.description, () => {
                expect(getNetworkLabel(...f.input)).toEqual(f.output);
            });
        });
    });
});
