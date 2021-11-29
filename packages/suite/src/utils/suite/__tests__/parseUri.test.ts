import { parseUri, parseQuery, getProtocolInfo } from '@suite-utils/parseUri';
import * as fixtures from '../__fixtures__/parseUri';

describe('parseUri', () => {
    fixtures.parseUri.forEach(f => {
        it(f.description, () => {
            const url = parseUri(f.uri as string);
            if (!url) {
                expect(f.result).toEqual(undefined);
                return;
            }
            // url is a class. get action needs to be called to get samples
            expect({
                host: url.host,
                protocol: url.protocol,
                pathname: url.pathname,
                search: url.search,
            }).toEqual(f.result);
        });
    });
});

describe('parseQuery', () => {
    fixtures.parseQuery.forEach(f => {
        it(f.description, () => {
            expect(parseQuery(f.uri as string)).toEqual(f.result);
        });
    });
});

describe('getProtocolInfo', () => {
    fixtures.getProtocolInfo.forEach(f => {
        it(f.description, () => {
            expect(getProtocolInfo(f.uri as string)).toEqual(f.result);
        });
    });
});
