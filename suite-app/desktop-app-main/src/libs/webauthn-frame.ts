import { WEBAUTHN_FRAME_ORIGIN } from '@suite/desktop-app-api';

export const WEBAUTHN_FRAME_SCRIPT_PATH = '/webauthn-frame.js';

const FRAME_DOCUMENT = `<!doctype html><title>Trezor Suite WebAuthn</title><script src="${WEBAUTHN_FRAME_SCRIPT_PATH}"></script>`;

const FRAME_HEADERS = {
    'Content-Security-Policy': "default-src 'none'; script-src 'self'",
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
};

export type WebauthnFrameProtocolHandlerDeps = {
    readFrameScript: () => Promise<string>;
    passThrough: (request: Request) => Promise<Response>;
};

export type WebauthnFrameProtocolHandler = (request: Request) => Promise<Response>;

export const createWebauthnFrameProtocolHandler =
    (deps: WebauthnFrameProtocolHandlerDeps): WebauthnFrameProtocolHandler =>
    async request => {
        const url = new URL(request.url);
        if (url.origin !== WEBAUTHN_FRAME_ORIGIN) {
            return deps.passThrough(request).catch(() => Response.error());
        }

        if (url.pathname === '/') {
            return new Response(FRAME_DOCUMENT, {
                headers: { ...FRAME_HEADERS, 'Content-Type': 'text/html; charset=utf-8' },
            });
        }

        if (url.pathname === WEBAUTHN_FRAME_SCRIPT_PATH) {
            return new Response(await deps.readFrameScript(), {
                headers: { ...FRAME_HEADERS, 'Content-Type': 'text/javascript; charset=utf-8' },
            });
        }

        return new Response(null, { status: 404, headers: FRAME_HEADERS });
    };

type FrameLike = {
    origin: string;
    executeJavaScript: (code: string, userGesture: boolean) => Promise<unknown>;
};

export type ActivateWebauthnFrameDeps = {
    getChildFrames: () => FrameLike[];
};

export type ActivateWebauthnFrame = () => Promise<boolean>;

export const createActivateWebauthnFrame =
    (deps: ActivateWebauthnFrameDeps): ActivateWebauthnFrame =>
    async () => {
        const frame = deps.getChildFrames().find(child => child.origin === WEBAUTHN_FRAME_ORIGIN);
        if (frame === undefined) {
            return false;
        }

        // Running a script with the user-gesture flag gives the frame the transient activation
        // that credential creation in a cross-origin frame requires.
        await frame.executeJavaScript('void 0', true);

        return true;
    };
