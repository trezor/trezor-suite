import { Protocol } from '@suite-common/suite-constants';

import { getNetworkSymbolForProtocol } from '../protocol';
import * as fixtures from '../__fixtures__/protocol';

describe('getNetworkSymbolForProtocol', () => {
    fixtures.getNetworkSymbolForProtocol.forEach(f => {
        it(f.description, () => {
            expect(getNetworkSymbolForProtocol(f.scheme as Protocol)).toEqual(f.result);
        });
    });
});
