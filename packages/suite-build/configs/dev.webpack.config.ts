import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import path from 'path';
import webpack from 'webpack';
import { WebpackPluginServe } from 'webpack-plugin-serve';

import { DEV_PORTS } from '../utils/constants';
import { project } from '../utils/env';
import { getPathForProject } from '../utils/path';

/**
 * `packages/suite-data/files/oauth/oauth_receiver.html`
 */
const oauthReceiverInlineScriptHash = 'sha256-CMsgtXIUgF58yz1R2jwFGG5Hnd9ZlhuaLq7llOPYQvY=';

/**
 * `packages/suite-web/src/static/index.html`
 */
const faviconInlineScriptHash = 'sha256-1YQBibZWwmN5MXiubzhih9QDjLdHB9/4SCFdoQQY8n4=';

const cspReportUri =
    'https://o117836.ingest.us.sentry.io/api/5193825/security/?sentry_key=6d91ca6e6a5d4de7b47989455858b5f6';

const distPath = path.join(getPathForProject(project), 'build');
const config: webpack.Configuration = {
    stats: {
        children: true,
        errorDetails: true,
    },
    mode: 'development',
    watch: true,
    devtool: 'eval-source-map',
    entry: ['webpack-plugin-serve/client'],
    output: {
        // This builds JS directly `dist/` (instead `dist/js/`)
        // without this, Evolu worker import won't (for unknow reason) work
        // Todo: Issue is probably in combination of @evolu/sqlite-wasm which wraps `mjs` files and our webpack config
        filename: '[name].js',
        chunkFilename: '[id].js',
        // ---
    },
    watchOptions: {
        // reduce number of file watchers; for HMR it is not necessary to watch both source code & node_modules
        ignored: /node_modules/,
    },
    plugins: [
        new WebpackPluginServe({
            // FIXME:
            middleware: app => {
                app.use(async (ctx, next) => {
                    await next();
                    ctx.set(
                        'Content-Security-Policy',
                        // TODO: get ridd off the sha256
                        `default-src 'self'; script-src 'self' 'unsafe-eval' '${oauthReceiverInlineScriptHash}' '${faviconInlineScriptHash}'; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; style-src-elem 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.trezor.io; connect-src data: *; frame-ancestors 'none'; upgrade-insecure-requests; report-uri ${cspReportUri}; report-to csp-endpoint`,
                    );

                    ctx.set(
                        'Report-To',
                        `${JSON.stringify({
                            group: 'csp-endpoint',
                            max_age: 10886400,
                            endpoints: [{ url: `${cspReportUri}` }],
                            include_subdomains: true,
                        })}`,
                    );

                    ctx.set('Reporting-Endpoints', `csp-endpoint=${cspReportUri}`);

                    /**
                     * No one can embed your site in an iframe.
                     */
                    ctx.set('X-Frame-Options', 'DENY');

                    /**
                     * Prevents the browser from trying to guess the MIME type of a file
                     * and instead forces it to use the one provided by the server.
                     */
                    ctx.set('X-Content-Type-Options', 'nosniff');

                    /**
                     * Sets `window.opener` to `null` for all outbound links.
                     */
                    ctx.set('Cross-Origin-Opener-Policy', 'same-origin');

                    // TODO:
                    ctx.set('Cross-Origin-Embedder-Policy', 'require-corp');

                    /**
                     * Prevents the browser from making cross-origin requests to the resource.
                     */
                    // ctx.set('Cross-origin-resource-policy', 'cross-origin');

                    ctx.set('Referrer-Policy', 'strict-origin-when-cross-origin');

                    ctx.set('Upgrade-Insecure-Requests', '1');
                });
            },
            port: DEV_PORTS[project],
            hmr: true,
            host: 'localhost',
            static: distPath,
            progress: true,
            historyFallback: {
                htmlAcceptHeaders: ['text/html', '*/*'],
                rewrites: [],
            },
            client: {
                address: `localhost:${DEV_PORTS[project]}`,
                protocol: 'ws',
            },
        }),
        new ReactRefreshWebpackPlugin({
            overlay: false,
        }),
    ],
};

export default config;
