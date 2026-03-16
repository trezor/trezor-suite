import { isWhitelistedHost } from '@trezor/utils';

import { createRequestPool } from './httpPool';
import { interceptFetch } from './interceptor/interceptFetch';
import { interceptHttp } from './interceptor/interceptHttp';
import { interceptHttps } from './interceptor/interceptHttps';
import { interceptNetConnect } from './interceptor/interceptNetConnect';
import { interceptNetSocketConnect } from './interceptor/interceptNetSocketConnect';
import { interceptTlsConnect } from './interceptor/interceptTlsConnect';
import { TorIdentities } from './torIdentities';
import { type InterceptorOptions } from './types';

/**
 * Create an interceptor that can be used to intercept and manage network requests made from a Node.js environment.

 * Note that this DOESN'T apply to requests from the Electron browser, that's done in `create-electron-session-interceptor.ts`
 */
export const createInterceptor = (interceptorOptions: InterceptorOptions) => {
    const requestPool = createRequestPool(interceptorOptions);
    const torIdentities = new TorIdentities(interceptorOptions.getTorSettings);
    const context = { ...interceptorOptions, requestPool, torIdentities };

    const validateRequest = ({ hostname }: { hostname: string }) => {
        // FYI for main electron session, the base list of whitelisted domains is in 'packages/suite-desktop-core/src/config.ts'
        if (!isWhitelistedHost(hostname, context.getWhitelistedDomains())) {
            // Sometimes the error is not reported correctly so for debug reasons we log it as well
            console.error(`Request blocked, not whitelisted domain: ${hostname}`);

            throw new Error(`Request blocked, not whitelisted domain: ${hostname}`);
        }
    };

    interceptNetSocketConnect({ context, validateRequest });
    interceptNetConnect({ context, validateRequest });
    interceptHttp({ context, validateRequest });
    interceptHttps({ context, validateRequest });
    interceptTlsConnect({ context, validateRequest });
    interceptFetch({ context, validateRequest });

    return { requestPool, torIdentities };
};
