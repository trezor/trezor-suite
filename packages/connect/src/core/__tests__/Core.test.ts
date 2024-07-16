import { parseConnectSettings } from '../../data/connectSettings';
import { DataManager } from '../../data/DataManager';
import { ConnectSettings } from '../../exports';
import { initCoreState } from '../index';

// import { createTestTransport } from '../../device/__tests__/DeviceList.test';
const { createTestTransport } = global.JestMocks;

const getSettings = (partial: Partial<ConnectSettings> = {}) =>
    parseConnectSettings({ transports: [createTestTransport()], ...partial });

describe('Core', () => {
    beforeAll(async () => {});

    it('getOrInit throws error on DataManager load', async () => {
        jest.spyOn(DataManager, 'load').mockImplementation(() => {
            throw new Error('DataManager init error');
        });

        const coreManager = initCoreState();
        await expect(() => coreManager.getOrInit(getSettings(), jest.fn())).rejects.toThrow(
            'DataManager init error',
        );

        jest.restoreAllMocks();
    });

    it('getOrInit throws error when disposed before initialization', async () => {
        const coreManager = initCoreState();
        const promise = coreManager.getOrInit(getSettings(), jest.fn());
        coreManager.dispose();
        await expect(promise).rejects.toThrow('Disposed during initialization');
    });

    it('calling getOrInit multiple times synchronously', async () => {
        const coreManager = initCoreState();
        const settings = getSettings({ lazyLoad: true });
        const [c1, c2] = await Promise.all([
            coreManager.getOrInit(settings, jest.fn()),
            coreManager.getOrInit(settings, jest.fn()),
        ]);

        // the same instance
        expect(c1).toEqual(c2);
        coreManager.dispose();
    });

    it('successful getOrInit', async () => {
        const coreManager = initCoreState();
        const eventsSpy = jest.fn();
        const core = await coreManager.getOrInit(getSettings(), eventsSpy);
        // no events emitted before initialization
        expect(eventsSpy).toHaveBeenCalledTimes(0);
        await new Promise(resolve => setTimeout(resolve, 1));
        // device + transport events emitted in next tick
        expect(eventsSpy).toHaveBeenCalledTimes(4);

        core.dispose();
    });
});
