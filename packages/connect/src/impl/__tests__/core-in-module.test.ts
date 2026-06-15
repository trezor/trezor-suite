import type { ConnectSettingsTransport } from '@trezor/connect-common';
import { TRANSPORT } from '@trezor/transport-common';

jest.mock('../../core', () => ({
    initCoreState: () => {
        let core: { handleMessage: jest.Mock } | null = null;

        return {
            get: () => core,
            getPending: () => null,
            getOrInit: jest.fn(() => {
                core = { handleMessage: jest.fn() };

                return Promise.resolve(core);
            }),
            dispose: () => {
                core = null;
            },
        };
    },
}));

import { CoreInModule } from '../core-in-module';

class TestTransportA {}
class TestTransportB {}
const DefaultA = TestTransportA as unknown as ConnectSettingsTransport;
const DefaultB = TestTransportB as unknown as ConnectSettingsTransport;

class TestCoreInModule extends CoreInModule {
    protected defaultTransports(): ConnectSettingsTransport[] {
        return [DefaultA, DefaultB];
    }
    protected updateProxy() {
        return Promise.resolve();
    }
}

const baseManifest = { appName: 'test', appUrl: 'test.local', email: 't@test.local' };

const settingsOf = (impl: CoreInModule) => (impl as unknown as { settings: any }).settings;
const handleMessageOf = (impl: CoreInModule) =>
    (
        impl as unknown as { coreManager: { get: () => { handleMessage: jest.Mock } | null } }
    ).coreManager.get()?.handleMessage ?? null;

describe('CoreInModule default transports', () => {
    it('init() without transports applies defaultTransports', async () => {
        const impl = new TestCoreInModule();
        await impl.init({ manifest: baseManifest });
        expect(settingsOf(impl).transports).toEqual([DefaultA, DefaultB]);
    });

    it('init({ transports: [] }) (empty array) applies defaultTransports', async () => {
        const impl = new TestCoreInModule();
        await impl.init({ manifest: baseManifest, transports: [] });
        expect(settingsOf(impl).transports).toEqual([DefaultA, DefaultB]);
    });

    it('init({ transports: [...] }) (non-empty) keeps the supplied list', async () => {
        const impl = new TestCoreInModule();
        const userT = { name: 'UserTransport' } as unknown as ConnectSettingsTransport;
        await impl.init({ manifest: baseManifest, transports: [userT] });
        expect(settingsOf(impl).transports).toEqual([userT]);
    });

    it('updateConnectSettings({ transports: [] }) applies defaultTransports and emits SET_TRANSPORTS', async () => {
        const impl = new TestCoreInModule();
        await impl.init({ manifest: baseManifest });
        const handleMessage = handleMessageOf(impl)!;
        handleMessage.mockClear();

        await impl.updateConnectSettings({ transports: [] });

        expect(settingsOf(impl).transports).toEqual([DefaultA, DefaultB]);
        expect(handleMessage).toHaveBeenCalledWith({
            type: TRANSPORT.SET_TRANSPORTS,
            payload: { transports: [DefaultA, DefaultB] },
        });
    });

    it('updateConnectSettings({ transports: [...] }) (non-empty) keeps the supplied list', async () => {
        const impl = new TestCoreInModule();
        await impl.init({ manifest: baseManifest });
        const handleMessage = handleMessageOf(impl)!;
        handleMessage.mockClear();
        const userT = { name: 'UserTransport' } as unknown as ConnectSettingsTransport;

        await impl.updateConnectSettings({ transports: [userT] });

        expect(settingsOf(impl).transports).toEqual([userT]);
        expect(handleMessage).toHaveBeenCalledWith({
            type: TRANSPORT.SET_TRANSPORTS,
            payload: { transports: [userT] },
        });
    });
});
