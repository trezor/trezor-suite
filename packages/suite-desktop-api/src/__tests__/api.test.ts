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

            expect(spy).toHaveBeenCalledTimes(1); // Only one event is processed
        });

        it('DesktopApi.on invalid channel', () => {
            const spy = jest.fn();
            // @ts-expect-error
            api.on('invalid-1', spy);
            // @ts-expect-error
            api.once('invalid-2', spy);
            ipcRenderer.emit('invalid-1', new Event('ipc'), true);
            ipcRenderer.emit('invalid-2', new Event('ipc'), true);
            expect(spy).toHaveBeenCalledTimes(0);
        });
    });

    describe('Methods', () => {
        it('DesktopApi.appRestart', () => {
            const spy = jest.spyOn(ipcRenderer, 'send');
            api.appRestart();
            expect(spy).toHaveBeenCalledWith('app/restart');

            // @ts-expect-error no expected params
            api.appRestart(true);
        });

        it('DesktopApi.appFocus', () => {
            const spy = jest.spyOn(ipcRenderer, 'send');
            api.appFocus();
            expect(spy).toHaveBeenCalledWith('app/focus');

            // @ts-expect-error no expected params
            api.appFocus(true);
        });

        it('DesktopApi.checkForUpdates', () => {
            const spy = jest.spyOn(ipcRenderer, 'send');
            api.checkForUpdates();
            expect(spy).toHaveBeenCalledWith('update/check', undefined);
            api.checkForUpdates(true);
            expect(spy).toHaveBeenCalledWith('update/check', true);

            // @ts-expect-error invalid param
            api.checkForUpdates('string');
            expect(spy).toHaveBeenCalledTimes(2); // invalid param not processed
        });

        it('DesktopApi.downloadUpdate', () => {
            const spy = jest.spyOn(ipcRenderer, 'send');
            api.downloadUpdate();
            expect(spy).toHaveBeenCalledWith('update/download');

            // @ts-expect-error no expected params
            api.downloadUpdate(true);
        });

        it('DesktopApi.installUpdate', () => {
            const spy = jest.spyOn(ipcRenderer, 'send');
            api.installUpdate();
            expect(spy).toHaveBeenCalledWith('update/install');

            // @ts-expect-error no expected params
            api.installUpdate(true);
        });

        it('DesktopApi.cancelUpdate', () => {
            const spy = jest.spyOn(ipcRenderer, 'send');
            api.cancelUpdate();
            expect(spy).toHaveBeenCalledWith('update/cancel');

            // @ts-expect-error no expected params
            api.cancelUpdate(true);
        });

        it('DesktopApi.allowPrerelease', () => {
            const spy = jest.spyOn(ipcRenderer, 'send');
            api.allowPrerelease(true);
            expect(spy).toHaveBeenCalledWith('update/allow-prerelease', true);

            // @ts-expect-error invalid param
            api.allowPrerelease('string');
            expect(spy).toHaveBeenCalledTimes(1); // invalid param not processed
        });

        it('DesktopApi.themeChange', () => {
            const spy = jest.spyOn(ipcRenderer, 'send');
            api.themeChange('dark');
            expect(spy).toHaveBeenCalledWith('theme/change', 'dark');

            // @ts-expect-error invalid theme
            api.themeChange('foo');
            // @ts-expect-error param is required
            api.themeChange();
            expect(spy).toHaveBeenCalledTimes(1); // invalid param not processed
        });

        it('DesktopApi.metadataWrite', async () => {
            const spy = jest
                .spyOn(ipcRenderer, 'invoke')
                .mockImplementation(() => Promise.resolve({ success: true }));
            const content = { file: 'file.txt', content: 'bar' };
            const result = await api.metadataWrite(content);
            expect(spy).toHaveBeenCalledWith('metadata/write', content);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.payload).toBe(undefined);
            } else {
                expect(result.error).toBe('should not happen');
            }

            // @ts-expect-error invalid params
            const fail = await api.metadataWrite({ file: 'file.txt' });
            expect(fail.success).toBe(false);
            expect(spy).toHaveBeenCalledTimes(1); // invalid param not processed
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
            expect(spy).toHaveBeenCalledWith('metadata/read', content);
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
            expect(spy).toHaveBeenCalledTimes(1); // invalid params not processed
        });

        it('DesktopApi.getHttpReceiverAddress', async () => {
            const spy = jest
                .spyOn(ipcRenderer, 'invoke')
                .mockImplementation(() => Promise.resolve('prefixed/coinmarket'));
            const result = await api.getHttpReceiverAddress('/coinmarket');
            expect(spy).toHaveBeenCalledWith('server/request-address', '/coinmarket');
            expect(result).toBe('prefixed/coinmarket');

            // @ts-expect-error invalid params
            const fail = await api.getHttpReceiverAddress(true);
            expect(fail).toBe(undefined);
            expect(spy).toHaveBeenCalledTimes(1); // invalid param not processed
        });

        it('DesktopApi.getTorStatus', () => {
            const spy = jest.spyOn(ipcRenderer, 'send');
            api.getTorStatus();
            expect(spy).toHaveBeenCalledWith('tor/get-status');

            // @ts-expect-error no expected params
            api.getTorStatus(true);
        });

        it('DesktopApi.toggleTor', () => {
            const spy = jest.spyOn(ipcRenderer, 'invoke');
            api.toggleTor(true);
            expect(spy).toHaveBeenCalledWith('tor/toggle', true);

            // @ts-expect-error no expected params
            api.toggleTor('string');
            expect(spy).toHaveBeenCalledTimes(1); // invalid param not processed
        });

        it('DesktopApi.clearStore', () => {
            const spy = jest.spyOn(ipcRenderer, 'send');
            api.clearStore();
            expect(spy).toHaveBeenCalledWith('store/clear');

            // @ts-expect-error no expected params
            api.clearStore(true);
        });

        it('DesktopApi.clearUserData', async () => {
            const spy = jest
                .spyOn(ipcRenderer, 'invoke')
                .mockImplementation(() => Promise.resolve({ success: true }));
            const result = await api.clearUserData();
            expect(spy).toHaveBeenCalledWith('user-data/clear');
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.payload).toBe(undefined);
            } else {
                expect(result.error).toBe('should not happen');
            }

            // @ts-expect-error no expected params
            api.clearUserData(true);
        });

        it('DesktopApi.openUserDataDirectory', async () => {
            const spy = jest
                .spyOn(ipcRenderer, 'invoke')
                .mockImplementation(() => Promise.resolve({ success: true }));

            const result = await api.openUserDataDirectory();
            expect(spy).toHaveBeenCalledWith('user-data/open', '');
            expect(result.success).toBe(true);

            const existingDirectory = '/metadata';
            api.openUserDataDirectory(existingDirectory);
            expect(spy).toHaveBeenCalledWith('user-data/open', existingDirectory);
        });

        it('DesktopApi.installUdevRules', async () => {
            const spy = jest
                .spyOn(ipcRenderer, 'invoke')
                .mockImplementation(() => Promise.resolve({ success: true }));
            const result = await api.installUdevRules();
            expect(spy).toHaveBeenCalledWith('udev/install');
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.payload).toBe(undefined);
            } else {
                expect(result.error).toBe('should not happen');
            }

            // @ts-expect-error no expected params
            api.installUdevRules(true);
        });

        it('DesktopApi.handshake', async () => {
            const spy = jest
                .spyOn(ipcRenderer, 'invoke')
                .mockImplementation(() => Promise.resolve());
            await api.handshake();
            expect(spy).toHaveBeenCalledWith('handshake/client');
        });

        it('DesktopApi.loadModules', async () => {
            const spy = jest
                .spyOn(ipcRenderer, 'invoke')
                .mockImplementation(() => Promise.resolve({ success: true }));
            const data = await api.loadModules(null);
            expect(spy).toHaveBeenCalledWith('handshake/load-modules', null);
            expect(data.success).toBe(true);

            // @ts-expect-error param expected
            api.loadModules();
        });
    });
});
