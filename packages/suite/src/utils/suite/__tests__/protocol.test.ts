import { getProtocolInfo, isProtocolScheme } from '@suite-utils/protocol';
import * as fixtures from '../__fixtures__/protocol';

jest.mock('@trezor/suite-analytics', () => global.JestMocks.getAnalytics());

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
