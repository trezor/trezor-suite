import { parseConnectSettings } from '../../data/connectSettings';
import { DataManager } from '../../data/DataManager';
import { initCoreState } from '../index';

// import { createTestTransport } from '../../device/__tests__/DeviceList.test';
const { createTestTransport } = global.JestMocks;

describe('Core', () => {
    beforeAll(async () => {});

    it('getOrInitCore throws error on DataManager load', async () => {
        jest.spyOn(DataManager, 'load').mockImplementation(() => {
            throw new Error('DataManager init error');
        });

        const coreManager = initCoreState();
        await expect(() =>
            coreManager.getOrInitCore(parseConnectSettings(), jest.fn()),
        ).rejects.toThrow('DataManager init error');

        jest.restoreAllMocks();
    });

    // TODO: this test breaks other tests. DeviceList loading is not disposed while disposing core.
    it.skip('getOrInitCore throws error when disposed before initialization', done => {
        const coreManager = initCoreState();
        coreManager.getOrInitCore(parseConnectSettings(), jest.fn()).catch(error => {
            expect(error.message).toMatch('Core disposed');
            done();
        });
        coreManager.dispose();
    });

    it('calling getOrInitCore multiple times synchronously', async () => {
        const coreManager = initCoreState();
        const transport = createTestTransport();
        const settings = parseConnectSettings({ transports: [transport], lazyLoad: true });
        const [c1, c2] = await Promise.all([
            coreManager.getOrInitCore(settings, jest.fn()),
            coreManager.getOrInitCore(settings, jest.fn()),
        ]);

        // the same instance
        expect(c1).toEqual(c2);
        coreManager.dispose();
    });

    it('successful getOrInitCore', async () => {
        const coreManager = initCoreState();
        const transport = createTestTransport();
        const eventsSpy = jest.fn();
        const core = await coreManager.getOrInitCore(
            parseConnectSettings({ transports: [transport] }),
            eventsSpy,
        );
        // no events emitted before initialization
        expect(eventsSpy).toHaveBeenCalledTimes(0);
        await new Promise(resolve => setTimeout(resolve, 1));
        // device + transport events emitted in next tick
        expect(eventsSpy).toHaveBeenCalledTimes(4);

        core.dispose();
    });
});
