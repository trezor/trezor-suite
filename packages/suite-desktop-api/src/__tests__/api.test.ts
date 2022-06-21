import { ipcRenderer } from './ipcRenderer';
import { getDesktopApi } from '../main';

const api = getDesktopApi(ipcRenderer);
if (!api) throw new Error('desktopApi not initialized');

describe('DesktopApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        ipcRenderer.removeAllListeners();
    });

    describe('Events', () => {
        it('DesktopApi.on omits event param', done => {
            api.on('tor/status', state => {
                expect(state).toBe(true);
                done();
            });
            ipcRenderer.emit('tor/status', new Event('ipc'), true); // Event param should be omitted
        });

        it('DesktopApi.once omits event param', done => {
            api.once('tor/status', state => {
                expect(state).toBe(true);
                done();
            });
            ipcRenderer.emit('tor/status', new Event('ipc'), true); // Event param should be omitted
        });

        it('DesktopApi.removeAllListener', () => {
            const spy = jest.fn();
            api.on('oauth/response', spy);
            ipcRenderer.emit('oauth/response', new Event('ipc'), {});
            api.removeAllListeners('oauth/response');
            ipcRenderer.emit('oauth/response', new Event('ipc'), {});
            ipcRenderer.emit('oauth/response', new Event('ipc'), {});
            ipcRenderer.emit('oauth/response', new Event('ipc'), {});

            expect(spy).toBeCalledTimes(1); // Only one event is processed
        });

        it('DesktopApi.on invalid channel', () => {
            const spy = jest.fn();
            // @ts-expect-error
            api.on('invalid-1', spy);
            // @ts-expect-error
            api.once('invalid-2', spy);
            ipcRenderer.emit('invalid-1', new Event('ipc'), true);
            ipcRenderer.emit('invalid-2', new Event('ipc'), true);
            expect(spy).toBeCalledTimes(0);
        });
    });

    describe('Methods', () => {
        it('DesktopApi.appRestart', () => {
            const spy = jest.spyOn(ipcRenderer, 'send');
            api.appRestart();
            expect(spy).toBeCalledWith('app/restart');

            // @ts-expect-error no expected params
            api.appRestart(true);
        });

        it('DesktopApi.appFocus', () => {
            const spy = jest.spyOn(ipcRenderer, 'send');
            api.appFocus();
            expect(spy).toBeCalledWith('app/focus');

            // @ts-expect-error no expected params
            api.appFocus(true);
        });

        it('DesktopApi.checkForUpdates', () => {
            const spy = jest.spyOn(ipcRenderer, 'send');
            api.checkForUpdates();
            expect(spy).toBeCalledWith('update/check', undefined);
            api.checkForUpdates(true);
            expect(spy).toBeCalledWith('update/check', true);

            // @ts-expect-error invalid param
            api.checkForUpdates('string');
            expect(spy).toBeCalledTimes(2); // invalid param not processed
        });

        it('DesktopApi.downloadUpdate', () => {
            const spy = jest.spyOn(ipcRenderer, 'send');
            api.downloadUpdate();
            expect(spy).toBeCalledWith('update/download');

            // @ts-expect-error no expected params
            api.downloadUpdate(true);
        });

        it('DesktopApi.installUpdate', () => {
            const spy = jest.spyOn(ipcRenderer, 'send');
            api.installUpdate();
            expect(spy).toBeCalledWith('update/install');

            // @ts-expect-error no expected params
            api.installUpdate(true);
        });

        it('DesktopApi.cancelUpdate', () => {
            const spy = jest.spyOn(ipcRenderer, 'send');
            api.cancelUpdate();
            expect(spy).toBeCalledWith('update/cancel');

            // @ts-expect-error no expected params
            api.cancelUpdate(true);
        });

        it('DesktopApi.allowPrerelease', () => {
            const spy = jest.spyOn(ipcRenderer, 'send');
            api.allowPrerelease(true);
            expect(spy).toBeCalledWith('update/allow-prerelease', true);

            // @ts-expect-error invalid param
            api.allowPrerelease('string');
            expect(spy).toBeCalledTimes(1); // invalid param not processed
        });

        it('DesktopApi.themeChange', () => {
            const spy = jest.spyOn(ipcRenderer, 'send');
            api.themeChange('dark');
            expect(spy).toBeCalledWith('theme/change', 'dark');

            // @ts-expect-error invalid theme
            api.themeChange('foo');
            // @ts-expect-error param is required
            api.themeChange();
            expect(spy).toBeCalledTimes(1); // invalid param not processed
        });

        it('DesktopApi.clientReady', () => {
            const spy = jest.spyOn(ipcRenderer, 'send');
            api.clientReady();
            expect(spy).toBeCalledWith('client/ready');

            // @ts-expect-error no expected params
            api.clientReady(true);
        });

        it('DesktopApi.metadataWrite', async () => {
            const spy = jest
                .spyOn(ipcRenderer, 'invoke')
                .mockImplementation(() => Promise.resolve({ success: true }));
            const content = { file: 'file.txt', content: 'bar' };
            const result = await api.metadataWrite(content);
            expect(spy).toBeCalledWith('metadata/write', content);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.payload).toBe(undefined);
            } else {
                expect(result.error).toBe('should not happen');
            }

            // @ts-expect-error invalid params
            const fail = await api.metadataWrite({ file: 'file.txt' });
            expect(fail.success).toBe(false);
            expect(spy).toBeCalledTimes(1); // invalid param not processed
        });

        it('DesktopApi.metadataRead', async () => {
            const spy = jest.spyOn(ipcRenderer, 'invoke').mockImplementation(() =>
                Promise.resolve({
                    success: true,
                    payload: 'file-content',
                }),
            );
            const content = { file: 'file.txt' };
            const result = await api.metadataRead(content);
            expect(spy).toBeCalledWith('metadata/read', content);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.payload).toBe('file-content');
            } else {
                expect(result.error).toBe('should not happen');
            }

            // @ts-expect-error invalid params
            const fail = await api.metadataRead({ file: true });
            expect(fail.success).toBe(false);
            // @ts-expect-error invalid params
            api.metadataRead({ file: null });
            // @ts-expect-error invalid params
            api.metadataRead(null);
            expect(spy).toBeCalledTimes(1); // invalid params not processed
        });

        it('DesktopApi.getHttpReceiverAddress', async () => {
            const spy = jest
                .spyOn(ipcRenderer, 'invoke')
                .mockImplementation(() => Promise.resolve('prefixed/coinmarket'));
            const result = await api.getHttpReceiverAddress('/coinmarket');
            expect(spy).toBeCalledWith('server/request-address', '/coinmarket');
            expect(result).toBe('prefixed/coinmarket');

            // @ts-expect-error invalid params
            const fail = await api.getHttpReceiverAddress(true);
            expect(fail).toBe(undefined);
            expect(spy).toBeCalledTimes(1); // invalid param not processed
        });

        it('DesktopApi.getTorStatus', () => {
            const spy = jest.spyOn(ipcRenderer, 'send');
            api.getTorStatus();
            expect(spy).toBeCalledWith('tor/get-status');

            // @ts-expect-error no expected params
            api.getTorStatus(true);
        });

        it('DesktopApi.toggleTor', () => {
            const spy = jest.spyOn(ipcRenderer, 'invoke');
            api.toggleTor(true);
            expect(spy).toBeCalledWith('tor/toggle', true);

            // @ts-expect-error no expected params
            api.toggleTor('string');
            expect(spy).toBeCalledTimes(1); // invalid param not processed
        });

        it('DesktopApi.clearStore', () => {
            const spy = jest.spyOn(ipcRenderer, 'send');
            api.clearStore();
            expect(spy).toBeCalledWith('store/clear');

            // @ts-expect-error no expected params
            api.clearStore(true);
        });

        it('DesktopApi.clearUserData', async () => {
            const spy = jest
                .spyOn(ipcRenderer, 'invoke')
                .mockImplementation(() => Promise.resolve({ success: true }));
            const result = await api.clearUserData();
            expect(spy).toBeCalledWith('user-data/clear');
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.payload).toBe(undefined);
            } else {
                expect(result.error).toBe('should not happen');
            }

            // @ts-expect-error no expected params
            api.clearUserData(true);
        });

        it('DesktopApi.getUserDataInfo', async () => {
            const spy = jest
                .spyOn(ipcRenderer, 'invoke')
                .mockImplementation(() =>
                    Promise.resolve({ success: true, payload: { dir: '/' } }),
                );
            const result = await api.getUserDataInfo();
            expect(spy).toBeCalledWith('user-data/get-info');
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.payload).toEqual({ dir: '/' });
            } else {
                expect(result.error).toBe('should not happen');
            }

            // @ts-expect-error no expected params
            api.getUserDataInfo(true);
        });

        it('DesktopApi.installUdevRules', async () => {
            const spy = jest
                .spyOn(ipcRenderer, 'invoke')
                .mockImplementation(() => Promise.resolve({ success: true }));
            const result = await api.installUdevRules();
            expect(spy).toBeCalledWith('udev/install');
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.payload).toBe(undefined);
            } else {
                expect(result.error).toBe('should not happen');
            }

            // @ts-expect-error no expected params
            api.installUdevRules(true);
        });
    });
});
