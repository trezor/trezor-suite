import http from 'http';
import { getWeakRandomId } from '@trezor/utils';
import { InterceptorOptions } from './types';

interface RequestData {
    id: string;
    requestTime: number;
    host: string;
}

export class RequestPool {
    requestPool: RequestData[] = [];
    requestTimeoutLimit = 1000 * 10;
    isNetworkMisbehaving = false;
    interceptorOptions: InterceptorOptions;

    constructor(interceptorOptions: InterceptorOptions) {
        this.interceptorOptions = interceptorOptions;
    }

    removeRequest(id: string) {
        this.requestPool = this.requestPool.filter(req => req.id !== id);
    }

    addRequest(request: http.ClientRequest) {
        const id = getWeakRandomId(10);
        const { host } = request;
        this.requestPool.push({
            id,
            requestTime: new Date().getTime(),
            host,
        });
        request.on('response', (response: http.IncomingMessage) => {
            const requestFromPool = this.requestPool.find(req => req.id === id);
            if (requestFromPool) {
                const timeRequestTook = new Date().getTime() - requestFromPool.requestTime;
                const { statusCode } = response;

                this.isNetworkMisbehaving = timeRequestTook > this.requestTimeoutLimit;
                if (this.isNetworkMisbehaving) {
                    this.interceptorOptions.handler({
                        type: 'NETWORK_MISBEHAVING',
                    });
                }
                this.interceptorOptions.handler({
                    type: 'INTERCEPTED_RESPONSE',
                    host: requestFromPool.host,
                    time: timeRequestTook,
                    statusCode,
                });
                this.removeRequest(id);
            }
        });

        request.on('error', (error: Error) => {
            const isProxyConnectionTimedout = error.message.includes('Proxy connection timed out');
            const isProxyRejectedConnection = error.message.includes(
                'Socks5 proxy rejected connection',
            );
            let errorType: 'ERROR' | 'ERROR_PROXY_TIMEOUT' | 'ERROR_PROXY_REJECTED' = 'ERROR';
            if (isProxyConnectionTimedout) {
                errorType = 'ERROR_PROXY_TIMEOUT';
            } else if (isProxyRejectedConnection) {
                errorType = 'ERROR_PROXY_REJECTED';
            }

            this.interceptorOptions.handler({
                type: errorType,
            });
            this.removeRequest(id);
        });
    }
}
