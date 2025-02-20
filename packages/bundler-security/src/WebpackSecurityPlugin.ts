/* eslint-disable no-console */
import webpack from 'webpack';

import { checkSecurityViolation } from './metroSecureResolver';

export class WebpackSecurityCheckPlugin {
    private logError(message: string) {
        console.error(`\x1b[1;31m${message}\x1b[0m`);
    }

    apply(compiler: webpack.Compiler) {
        compiler.hooks.normalModuleFactory.tap('SecurityCheckPlugin', factory => {
            factory.hooks.resolve.tap('SecurityCheckPlugin', resolveData => {
                const { request, context, contextInfo } = resolveData;

                const { isViolation, normalizedPath } = checkSecurityViolation({
                    moduleName: request,
                    originModulePath: context,
                });

                if (isViolation) {
                    console.log('\n\n');
                    this.logError(
                        `SECURITY ALERT: A third-party package is trying to import internal Trezor package! ` +
                            `\nRequesting module: ${request}` +
                            `\nNormalized path: ${normalizedPath}` +
                            `\nImmediate importer: ${context}` +
                            `\nOriginal issuer: ${contextInfo.issuer}`,
                    );
                    // Manually exit othewise webpack will only print error and happily continue building
                    process.exit(1);
                }
            });
        });
    }
}
