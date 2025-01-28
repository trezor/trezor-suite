import { Protocol } from '@suite-common/suite-constants';

import * as fixtures from '../__fixtures__/protocol';
import { getNetworkSymbolForProtocol } from '../protocol';

describe('getNetworkSymbolForProtocol', () => {
    fixtures.getNetworkSymbolForProtocol.forEach(f => {
        it(f.description, () => {
            expect(getNetworkSymbolForProtocol(f.scheme as Protocol)).toEqual(f.result);
        });
    });
});
