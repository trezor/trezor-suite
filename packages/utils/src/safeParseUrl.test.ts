import { safeParseUrl } from './safeParseUrl';

describe('safeParseUrl', () => {
    it.each([
        {
            description: 'valid http scheme',
            uri: 'http://www.trezor.io?amount=1',
            result: {
                host: 'www.trezor.io',
                protocol: 'http:',
                pathname: '/',
                search: '?amount=1',
            },
        },
        {
            description: 'valid protocol scheme (address ends up in pathname)',
            uri: 'bitcoin:3QmuBaZrJNCxc5Xs7aGzZUK8RirUT8jRKf?amount=0.1',
            result: {
                host: '',
                protocol: 'bitcoin:',
                pathname: '3QmuBaZrJNCxc5Xs7aGzZUK8RirUT8jRKf',
                search: '?amount=0.1',
            },
        },
        {
            description: 'valid scheme with slashes (address ends up in host)',
            uri: 'bitcoin://3QmuBaZrJNCxc5Xs7aGzZUK8RirUT8jRKf?amount=0.1',
            result: {
                host: '3QmuBaZrJNCxc5Xs7aGzZUK8RirUT8jRKf',
                protocol: 'bitcoin:',
                pathname: '',
                search: '?amount=0.1',
            },
        },
    ])('parses $description', ({ uri, result }) => {
        const url = safeParseUrl(uri);

        expect(url).toBeInstanceOf(URL);
        expect({
            host: url?.host,
            protocol: url?.protocol,
            pathname: url?.pathname,
            search: url?.search,
        }).toEqual(result);
    });

    it.each([
        { description: 'a string with no scheme', uri: 'www.trezor.io' },
        { description: 'an empty string', uri: '' },
    ])('returns null for $description', ({ uri }) => {
        expect(safeParseUrl(uri)).toBeNull();
    });
});
