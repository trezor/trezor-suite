import { parseUri } from '@suite-utils/parseUri';

describe('parseUri', () => {
    describe('parsedUri', () => {
        it('should return object with address and all query params', () => {
            const parsedUri = parseUri('http://trezor.io?foo=bar&baz=1337');
            expect(parsedUri).toEqual({
                address: '//trezor.io',
                foo: 'bar',
                baz: '1337',
            });
        });
    });

    describe('parsedUriNoPrefix', () => {
        it('should return object with address and all query params', () => {
            const parsedUriNoPrefix = parseUri('trezor.io?foo=bar&baz=1337');
            expect(parsedUriNoPrefix).toEqual({
                address: 'trezor.io',
                foo: 'bar',
                baz: '1337',
            });
        });
    });

    describe('parsedMalformedUri', () => {
        it('should return object with address and all query params that are not malformed', () => {
            const parsedMalformedUri = parseUri('trezor.io?foo&baz=1337');
            expect(parsedMalformedUri).toEqual({
                address: 'trezor.io',
                baz: '1337',
            });
        });
    });

    describe('parsedEmptyUri', () => {
        it('should return object with empty address', () => {
            const parsedEmptyUri = parseUri('');
            expect(parsedEmptyUri).toEqual({
                address: '',
            });
        });
    });

    describe('parseUri multi', () => {
        it('should work with any type of URIs', () => {
            expect(parseUri('http://www.trezor.io')).toEqual({
                address: '//www.trezor.io',
            });
            expect(parseUri('www.trezor.io')).toEqual({
                address: 'www.trezor.io',
            });
            expect(parseUri('www.trezor.io/route')).toEqual({
                address: 'www.trezor.io/route',
            });
            expect(parseUri('www.trezor.io/route?query=1&odd')).toEqual({
                address: 'www.trezor.io/route',
                query: '1',
            });
            expect(parseUri('www.trezor.io?query=1&amount=1')).toEqual({
                address: 'www.trezor.io',
                query: '1',
                amount: '1',
            });
        });
    });
