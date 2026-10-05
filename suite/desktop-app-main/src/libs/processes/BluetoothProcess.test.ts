import { type ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'events';

import { BluetoothProcess } from './BluetoothProcess';
import { Logger } from '../logger';

jest.mock('electron', () => ({
    app: {
        isPackaged: false,
        getPath: jest.fn(() => '/tmp/user-data'),
    },
}));

jest.mock('child_process', () => ({
    ...jest.requireActual('child_process'),
    spawn: jest.fn(),
}));

const logger = new Logger('mute');
global.resourcesPath = '/resources';

class MockChildProcess extends EventEmitter {
    killed = false;

    kill() {
        this.killed = true;

        return true;
    }
}

const mockServer = ({ url, requiresToken }: { url: string; requiresToken: boolean }) => {
    const child = new MockChildProcess();
    jest.mocked(spawn).mockReturnValue(child as unknown as ChildProcess);
    jest.spyOn(global, 'fetch').mockImplementation((input, init) => {
        if (input !== url) {
            return Promise.reject(new TypeError('fetch failed'));
        }

        if (requiresToken && !new Headers(init?.headers).has('Authorization')) {
            return Promise.reject(new TypeError('fetch failed'));
        }

        return Promise.resolve(new Response('ok'));
    });

    return child;
};

describe('BluetoothProcess', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('uses the address the server listens on', () => {
        expect(new BluetoothProcess({ port: 21400, logger }).getUrl()).toBe(
            'http://127.0.0.1:21400/',
        );
    });

    it('keeps a server that requires the token', async () => {
        const bluetoothProcess = new BluetoothProcess({ port: 21400, logger });
        const child = mockServer({ url: bluetoothProcess.getUrl(), requiresToken: true });

        await bluetoothProcess.start();

        expect(child.killed).toBe(false);
    });

    it('stops a server that serves requests without the token', async () => {
        const bluetoothProcess = new BluetoothProcess({ port: 21400, logger });
        const child = mockServer({ url: bluetoothProcess.getUrl(), requiresToken: false });

        await expect(bluetoothProcess.start()).rejects.toThrow('authorization token');
        expect(child.killed).toBe(true);
    });
});
