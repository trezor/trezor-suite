import { exposeIpcProxy } from '../proxy-generator';
import { createIpcProxyHandler } from '../proxy-handler';
import { createIpcProxy } from '../proxy';
import { ipcRenderer, ipcMain, exposeInMainWorld } from './mockedElectron';

const TestApi = {
    getApiMethod: () => Promise.resolve('Response from TestApi'),
};

describe('ipc-interface-generator', () => {
    beforeAll(() => {
        // electron-preload context
        exposeInMainWorld(...exposeIpcProxy(ipcRenderer));
    });

    beforeEach(() => {
        jest.clearAllMocks();
        ipcRenderer.removeAllListeners();
        ipcMain.removeAllListeners();
    });

    it('api request', async () => {
        // electron-main context
        createIpcProxyHandler({
            ipcMain,
            prefix: 'TestApi',
            debug: console,
            createInstance: () => TestApi,
        });

        // electron-renderer context
        const apiRenderer = createIpcProxy('TestApi', []);

        const result = await apiRenderer.getApiMethod();
        expect(result).toBe('Response from TestApi');

        try {
            await apiRenderer.notFoundMethod();
        } catch (error) {
            expect(error.message).toMatch('notFoundMethod is not a function');
        }
    });

    // it('ipc-interface-handler is not implemented', () => {
    //     const spy = jest.spyOn(ipcRenderer, 'invoke').mockImplementation((...args: any[]) => {
    //         console.warn('in mock!', args);
    //         return Promise.reject(new Error('not implemented'));
    //     });
    //     try {
    //         generateIpcInterface(ipcRenderer as any, {
    //             prefix: 'TestApi',
    //             methods: [],
    //         });
    //     } catch (error) {
    //         expect(spy).toBeCalledWith(['TestApi/request']);
    //         expect(error).toBe('not implemented');
    //     }
    // });

    // it('api request', async () => {
    //     // const spy = jest.spyOn(ipcRenderer, 'send').mockImplementation((...args: any[]) => {
    //     //     console.warn('in mock!', args);
    //     //     return Promise.resolve({ success: true });
    //     // });
    //     // ipcMain.handle('TestApi/create', () => {
    //     //     console.warn('mam v ipc main!!!');
    //     // });

    //     const apiMain = {
    //         getApiMethod: () => Promise.resolve('Returned from main'),
    //     };

    //     initIpcInterface({
    //         ipcMain,
    //         prefix: 'TestApi',
    //         debug: console,
    //         createInstance: () => apiMain,
    //     });
    //     // const spy2 = jest.spyOn(ipcRenderer, 'invoke').mockImplementation((...args: any[]) => {
    //     //     console.warn('in mock!', args);
    //     //     return Promise.reject(new Error('not inplemented'));
    //     // });
    //     // const content = { file: 'file.txt', content: 'bar' };
    //     // const result = await api.metadataWrite(content);

    //     const apiRenderer = await generateIpcInterface(ipcRenderer as any, {
    //         prefix: 'TestApi',
    //         methods: [],
    //     });
    //     console.warn('API', apiRenderer);
    //     const result = await apiRenderer.getApiMethod();
    //     console.warn('RESULT-1', result);
    //     const result2 = apiRenderer.foo();
    //     console.warn('RESULT-2', result2);
    //     expect(1).toBe(1);
    //     // expect(spy).toBeCalledWith({ 1: ['TestApi/request'] });
    //     // const spyError = jest.spyOn(console, 'error').mockImplementation();
    //     // expect(desktopApi.available).toBe(false);
    //     // desktopApi.on('protocol/open', () => {});
    //     // desktopApi.once('protocol/open', () => {});
    //     // desktopApi.removeAllListeners('protocol/open');
    //     // desktopApi.clearStore();
    //     // expect(spyError).toHaveBeenCalledTimes(4);
    //     // expect(desktopApi.metadataRead({ file: 'foo.txt' })).rejects.toThrow();
    // });

    // it('api events', () => {
    //     const ipcEventName = 'TestApi/event-listener/some-event';
    //     const spy = jest.fn();
    //     const api = generateIpcInterface(ipcRenderer as any, { prefix: 'TestApi', methods: [] });
    //     api.on('some-event', spy);
    //     ipcRenderer.emit(ipcEventName, 'ElectronEvent', [
    //         'ActualResponse-arg-1',
    //         'ActualResponse-arg-2',
    //     ]);
    //     expect(spy).toBeCalledWith('ActualResponse-arg-1', 'ActualResponse-arg-2');

    //     const spy2 = jest.fn();
    //     api.on('some-event', spy2);

    //     ipcRenderer.emit(ipcEventName, 'ElectronEvent', []);
    //     expect(spy).toBeCalledTimes(2);
    //     expect(spy2).toBeCalledTimes(1);

    //     api.off('some-event', spy);
    //     ipcRenderer.emit(ipcEventName, 'ElectronEvent', []);
    //     expect(spy).toBeCalledTimes(2); // this listener was removed, so number of calls is still the same
    //     expect(spy2).toBeCalledTimes(2);

    //     api.off('some-event', spy2);
    //     expect(ipcRenderer.listenerCount(ipcEventName)).toBe(0);
    // });

    // it('api is defined', () => {
    //     const api = factory(ipcRenderer);
    //     process.env.SUITE_TYPE = 'desktop';
    //     // @ts-expect-error
    //     window.desktopApi = api;
    //     // getter returns API
    //     expect(getDesktopApi().available).toBe(true);
    //     // variable doesn't return API (api was assigned AFTER var was declared)
    //     expect(desktopApi.available).toBe(false);
    // });
});
