import { testMocks } from '@suite-common/test-utils';

import { getProtocolInfo } from 'src/utils/suite/protocol';
import * as fixtures from '../__fixtures__/protocol';

jest.doMock('@trezor/suite-analytics', () => testMocks.getAnalytics());

describe('getProtocolInfo', () => {
    fixtures.getProtocolInfo.forEach(f => {
        it(f.description, () => {
            expect(getProtocolInfo(f.uri as string)).toEqual(f.result);
        });
    });
});
