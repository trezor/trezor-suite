import { getNetworkLabel } from './ethereumUtils';
import * as fixtures from '../../mocks/mockEthereumUtils';

describe('utils/ethereumUtils', () => {
    describe('getNetworkLabel', () => {
        fixtures.getNetworkLabelFixtures.forEach(f => {
            it(f.description, () => {
                expect(getNetworkLabel(...f.input)).toEqual(f.output);
            });
        });
    });
});
