import { createMockDeps } from '@trezor/dependency-injection';

import {
    type ActivateWebauthnFrameDeps,
    WEBAUTHN_FRAME_SCRIPT_PATH,
    type WebauthnFrameProtocolHandlerDeps,
    createActivateWebauthnFrame,
    createWebauthnFrameProtocolHandler,
} from './webauthn-frame';

const FRAME_ORIGIN = 'http://localhost:21345';

const createHandlerDeps = () =>
    createMockDeps<WebauthnFrameProtocolHandlerDeps>({
        readFrameScript: () => Promise.resolve('frame script'),
        passThrough: () => Promise.resolve(new Response('from network')),
    });

describe(createWebauthnFrameProtocolHandler.name, () => {
    it('serves the frame document that loads the frame script', async () => {
        const handler = createWebauthnFrameProtocolHandler(createHandlerDeps());

        const response = await handler(new Request(`${FRAME_ORIGIN}/`));

        expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
        expect(await response.text()).toContain(`<script src="${WEBAUTHN_FRAME_SCRIPT_PATH}">`);
    });

    it('serves the frame script', async () => {
        const deps = createHandlerDeps();
        const handler = createWebauthnFrameProtocolHandler(deps);

        const response = await handler(new Request(`${FRAME_ORIGIN}${WEBAUTHN_FRAME_SCRIPT_PATH}`));

        expect(response.headers.get('Content-Type')).toBe('text/javascript; charset=utf-8');
        expect(await response.text()).toBe('frame script');
        expect(deps.passThrough).not.toHaveBeenCalled();
    });

    it('answers unknown frame paths with 404', async () => {
        const handler = createWebauthnFrameProtocolHandler(createHandlerDeps());

        const response = await handler(new Request(`${FRAME_ORIGIN}/index.html`));

        expect(response.status).toBe(404);
    });

    it.each(['http://localhost:21346/', 'http://127.0.0.1:21345/', 'http://example.com/'])(
        'passes %s on to the network',
        async url => {
            const deps = createHandlerDeps();
            const handler = createWebauthnFrameProtocolHandler(deps);

            const response = await handler(new Request(url));

            expect(await response.text()).toBe('from network');
            expect(deps.readFrameScript).not.toHaveBeenCalled();
        },
    );

    it('turns a failed network request into a network error response', async () => {
        const deps = createHandlerDeps();
        deps.passThrough.mockRejectedValue(new Error('net::ERR_CONNECTION_RESET'));
        const handler = createWebauthnFrameProtocolHandler(deps);

        const response = await handler(new Request('http://127.0.0.1:21325/listen'));

        expect(response.type).toBe('error');
    });
});

describe(createActivateWebauthnFrame.name, () => {
    it('runs a user-gesture script in the frame', async () => {
        const executeJavaScript = jest.fn(() => Promise.resolve(undefined));
        const deps: ActivateWebauthnFrameDeps = {
            getChildFrames: () => [
                { origin: 'https://example.com', executeJavaScript: jest.fn() },
                { origin: FRAME_ORIGIN, executeJavaScript },
            ],
        };

        expect(await createActivateWebauthnFrame(deps)()).toBe(true);
        expect(executeJavaScript).toHaveBeenCalledWith('void 0', true);
    });

    it('reports a missing frame', async () => {
        const deps: ActivateWebauthnFrameDeps = { getChildFrames: () => [] };

        expect(await createActivateWebauthnFrame(deps)()).toBe(false);
    });
});
