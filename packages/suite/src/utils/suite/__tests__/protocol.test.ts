import { getProtocolInfo } from 'src/utils/suite/protocol';

import * as fixtures from '../__fixtures__/protocol';

describe('getProtocolInfo', () => {
    fixtures.getProtocolInfo.forEach(f => {
        it(f.description, () => {
            expect(getProtocolInfo(f.uri as string)).toEqual(f.result);
        });
    });
});
