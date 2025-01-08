import { TorIdentities } from './torIdentities';
import { InterceptorOptions } from './types';
import { createRequestPool } from './httpPool';
import { interceptTlsConnect } from './interceptor/interceptTlsConnect';
import { interceptHttps } from './interceptor/interceptHttps';
import { interceptHttp } from './interceptor/interceptHttp';
import { interceptNetConnect } from './interceptor/interceptNetConnect';
import { interceptNetSocketConnect } from './interceptor/interceptNetSocketConnect';

export const createInterceptor = (interceptorOptions: InterceptorOptions) => {
    const requestPool = createRequestPool(interceptorOptions);
    const torIdentities = new TorIdentities(interceptorOptions.getTorSettings);
    const context = { ...interceptorOptions, requestPool, torIdentities };

    interceptNetSocketConnect(context);
    interceptNetConnect(context);
    interceptHttp(context);
    interceptHttps(context);
    interceptTlsConnect(context);

    return { requestPool, torIdentities };
};
