import { allowRendererOrigin } from './renderer-cors';

jest.mock('electron', () => ({
    app: { getAppPath: jest.fn() },
    net: { fetch: jest.fn() },
    protocol: { handle: jest.fn(), registerSchemesAsPrivileged: jest.fn() },
}));

const rendererFrameUrl = 'suite://app/index.html';
const requestUrl = 'https://earn.trezor.io/staking/v1/trx/stats';

describe(allowRendererOrigin.name, () => {
    it('allows the renderer origin on a response that allows no origin', () => {
        expect(
            allowRendererOrigin({
                frameUrl: rendererFrameUrl,
                requestUrl,
                responseHeaders: { 'content-type': ['application/json'] },
            }),
        ).toEqual({
            'content-type': ['application/json'],
            'Access-Control-Allow-Origin': ['suite://app'],
        });
    });

    it('replaces the origin the backend allowed, whatever the case of the header', () => {
        expect(
            allowRendererOrigin({
                frameUrl: rendererFrameUrl,
                requestUrl: 'http://127.0.0.1:21325/',
                responseHeaders: {
                    'access-control-allow-origin': ['https://electron.trezor.io'],
                    'access-control-allow-headers': ['content-type'],
                },
            }),
        ).toEqual({
            'access-control-allow-headers': ['content-type'],
            'Access-Control-Allow-Origin': ['suite://app'],
        });
    });

    it('allows the renderer origin when the response has no headers', () => {
        expect(
            allowRendererOrigin({
                frameUrl: rendererFrameUrl,
                requestUrl,
                responseHeaders: undefined,
            }),
        ).toEqual({ 'Access-Control-Allow-Origin': ['suite://app'] });
    });

    it.each([
        ['another page', 'https://trezor.io/'],
        ['the legacy-origin export page', 'file:///app/build/legacy-origin-storage.html'],
        ['an origin that only starts like the renderer origin', 'suite://app.evil/index.html'],
        ['no frame', undefined],
    ])('leaves a response to a request from %s as it is', (_, frameUrl) => {
        const responseHeaders = { 'content-type': ['application/json'] };

        expect(allowRendererOrigin({ frameUrl, requestUrl, responseHeaders })).toBe(
            responseHeaders,
        );
    });

    it("leaves the renderer's own resources as they are", () => {
        const responseHeaders = { 'content-type': ['text/javascript'] };

        expect(
            allowRendererOrigin({
                frameUrl: rendererFrameUrl,
                requestUrl: 'suite://app/js/main.js',
                responseHeaders,
            }),
        ).toBe(responseHeaders);
    });
});
