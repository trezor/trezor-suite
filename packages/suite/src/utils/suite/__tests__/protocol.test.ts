import { testMocks } from '@suite-common/test-utils';

import { getProtocolInfo, isProtocolScheme } from 'src/utils/suite/protocol';
import * as fixtures from '../__fixtures__/protocol';

jest.doMock('@trezor/suite-analytics', () => testMocks.getAnalytics());

describe('getProtocolInfo', () => {
    fixtures.getProtocolInfo.forEach(f => {
        it(f.description, () => {
            expect(getProtocolInfo(f.uri as string)).toEqual(f.result);
        });
    });
});

describe('isProtocolScheme', () => {
    fixtures.isProtocolScheme.forEach(f => {
        it(f.description, () => {
            expect(isProtocolScheme(f.scheme)).toEqual(f.result);
        });
    });
});
