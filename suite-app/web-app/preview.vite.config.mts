import { type Plugin, defineConfig } from 'vite';

import { getSecurityHeaders, getSecurityHeadersByPath } from './constants/webSecurityHeaders';

const PREVIEW_HEADERS = { 'Document-Policy': 'js-profiling' };

/**
 * Sets the security headers per path like production does.
 * `preview.headers` can't do it, because it applies one set to every path.
 */
const securityHeadersPlugin = (): Plugin => {
    const defaultHeaders = { ...getSecurityHeaders(), ...PREVIEW_HEADERS };
    const headersByPath = new Map(
        Array.from(getSecurityHeadersByPath(), ([path, headers]) => [
            path,
            { ...headers, ...PREVIEW_HEADERS },
        ]),
    );

    return {
        name: 'suite-web-security-headers',
        configurePreviewServer: server => {
            server.middlewares.use((req, res, next) => {
                const { pathname } = new URL(req.url ?? '/', 'http://localhost');
                const headers = headersByPath.get(pathname) ?? defaultHeaders;

                for (const [name, value] of Object.entries(headers)) {
                    res.setHeader(name, value);
                }

                next();
            });
        },
    };
};

export default defineConfig({
    plugins: [securityHeadersPlugin()],
    preview: {
        port: 8000,
        open: true,
    },
});
