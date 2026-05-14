import { type Protocol } from '@suite-common/suite-constants';

import * as fixtures from '../__fixtures__/protocol';
import { getNetworkSymbolForProtocol, parseErc681TransferUri } from '../protocol';

describe('getNetworkSymbolForProtocol', () => {
    fixtures.getNetworkSymbolForProtocol.forEach(f => {
        it(f.description, () => {
            expect(getNetworkSymbolForProtocol(f.scheme as Protocol)).toEqual(f.result);
        });
    });
});

describe('parseErc681TransferUri', () => {
    fixtures.parseErc681TransferUri.forEach(f => {
        it(f.description, () => {
            expect(parseErc681TransferUri(f.uri)).toEqual(f.result);
        });
    });
});
