import { createProxy } from '../message-channel-proxy';
import { createProxyHandler } from '../message-channel-handler';

// create api in context worker/main
const getApiInstance = (context: string) => ({
    context,
    getContext: () => Promise.resolve({ success: true, payload: { context } }),
    bar: (_arg1: string, _arg2: number) => Promise.reject(new Error('bar not implemented')),
});

class PseudoWorker {
    async load() {
        const api = getApiInstance('worker');
        await createProxyHandler(() =>
            Promise.resolve({
                api: getApiInstance('worker'),
                channel: {
                    channelName: 'worker1',
                    postMessage: (data: any) => {
                        this.onmessage({ data });
                        // in real Worker context it would be `postMessage`
                    },
                    handleMessage: (fn: any) => {
                        this.postMessage = ({ data }: any) => fn(data);
                        // in real Worker context it would be `onmessage`
                    },
                },
            }),
        );
        return api;
    }

    async createProxy() {
        const api = getApiInstance('worker');
        await createProxy(
            () =>
                Promise.resolve({
                    api,
                    channel: {
                        channelName: 'worker1',
                        postMessage: (data: any) => this.onmessage({ data }),
                        handleMessage: (fn: any) => {
                            this.postMessage = ({ data }: any) => fn(data);
                        },
                    },
                }),
            { overrideApiMethods: true },
        );
        return api;
    }

    postMessage(event: { data: any }) {
        console.warn('Pseudoworker postMessage', event);
    }
    onmessage(event: { data: any }) {
        console.warn('Pseudoworker onmessage', event);
    }
}

describe('proxy', () => {
    it('proxy in main, implementation in worker', async () => {
        const api = getApiInstance('main');

        const apiFactory = async () => {
            const worker = new PseudoWorker();
            // simulate worker.onload
            await worker.load();

            // setup communication channel
            const channel = {
                channelName: 'worker1',
                postMessage: (data: any) => worker.postMessage({ data }),
                handleMessage: (listener: any) => {
                    worker.onmessage = event => listener(event.data);
                },
            };

            return Promise.resolve({ api, channel });
        };

        await createProxy(apiFactory, {
            overrideApiMethods: true,
        });

        const resp = await api.getContext();
        expect(resp.payload.context).toEqual('worker');
    });

    it('proxy in worker, implementation in main', async () => {
        // create worker
        const worker = new PseudoWorker();

        // set proxy handler im main
        const handlerDispose = await createProxyHandler(() =>
            Promise.resolve({
                api: getApiInstance('main'),
                channel: {
                    channelName: 'worker1',
                    postMessage: (data: any) => worker.postMessage({ data }),
                    handleMessage: (listener: any) => {
                        worker.onmessage = event => listener(event.data);
                    },
                },
            }),
        );

        // lets pretend that this is worker on load process
        const api = await worker.createProxy();
        // simulate some worker inner action
        const resp = await api.getContext();
        expect(api.context).toEqual('worker');
        // response received from proxy-handler
        expect(resp.payload.context).toEqual('main');

        handlerDispose();
    });
});
