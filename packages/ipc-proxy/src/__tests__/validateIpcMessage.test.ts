import path from 'path';

import { type ElectronIpcMainInvokeEvent } from '../types';
import { validateIpcMessage } from '../validateIpcMessage';

const createSenderFrame = (url: string, destroyed?: boolean): ElectronIpcMainInvokeEvent => ({
    senderFrame: { url: encodeURI(url), isDestroyed: () => destroyed === true },
});

const APP_IMAGE_EXAMPLE_DIRNAME = `/tmp/.mount_TrezorXsQUqQ/resources/app.asar/dist`;
const appImageDirnameProvider = () => APP_IMAGE_EXAMPLE_DIRNAME;

describe(validateIpcMessage.name, () => {
    it('passes when in DEV (localhost:8000)', () => {
        validateIpcMessage({
            ipcEvent: createSenderFrame('http://localhost:8000/'),
            dirnameProvider: appImageDirnameProvider,
        });
    });

    it('passes in PROD: AppImage Linux example', () => {
        const senderUrl = 'file:///tmp/.mount_TrezorXsQUqQ/resources/app.asar/build/index.html';

        validateIpcMessage({
            ipcEvent: createSenderFrame(senderUrl),
            dirnameProvider: appImageDirnameProvider,
        });
    });

    it('passes in PROD: Windows example', () => {
        // note that the path contains spaces (will be URI encoded to %20)
        const senderUrl =
            'file:///C:/Users/myself/AppData/Local/Programs/Trezor Suite/resources/app.asar/build/index.html';

        validateIpcMessage({
            ipcEvent: createSenderFrame(senderUrl),
            dirnameProvider: () =>
                'C:\\Users\\myself\\AppData\\Local\\Programs\\Trezor Suite\\resources\\app.asar\\dist',
            platformProvider: () => 'win32',
            pathProvider: path.win32,
        });
    });

    it('passes in PROD: macOS example', () => {
        // note that the path contains spaces (will be URI encoded to %20)
        const senderUrl =
            'file:///Applications/Trezor Suite.app/Contents/Resources/app.asar/build/index.html';

        validateIpcMessage({
            ipcEvent: createSenderFrame(senderUrl),
            dirnameProvider: () =>
                '/Applications/Trezor Suite.app/Contents/Resources/app.asar/dist',
            platformProvider: () => 'macos',
        });
    });

    it('errors when not in PROD environment and is on (localhost.8000)', () => {
        const original = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const subject = () => {
            validateIpcMessage({
                ipcEvent: createSenderFrame('http://localhost:8000/'),
                dirnameProvider: appImageDirnameProvider,
            });
        };

        expect(subject).toThrow('Hostname localhost found, must be empty');

        process.env.NODE_ENV = original;
    });

    it('errors for malicious URL', () => {
        const subject = () => {
            validateIpcMessage({
                ipcEvent: createSenderFrame('https://www.irs.gov/'),
                dirnameProvider: appImageDirnameProvider,
            });
        };

        expect(subject).toThrow('Hostname www.irs.gov found, must be empty');
    });

    it('errors for invalid senderFrame', () => {
        const subject = () => {
            validateIpcMessage({
                ipcEvent: {} as ElectronIpcMainInvokeEvent,
                dirnameProvider: appImageDirnameProvider,
            });
        };

        expect(subject).toThrow('Invalid ipcEvent: {}');
    });

    it('errors when senderFrame has been destroyed', () => {
        const subject = () => {
            validateIpcMessage({
                ipcEvent: createSenderFrame('http://localhost:8000/', true),
                dirnameProvider: appImageDirnameProvider,
            });
        };

        expect(subject).toThrow('ipcEvent.senderFrame is destroyed');
    });

    it('errors when in production, you get different protocol to file:', () => {
        const original = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const SCAM_URL =
            'https://www.scam.com/tmp/.mount_Trezor0JOnDC/resources/app.asar/build/index.html';

        const subject = () => {
            validateIpcMessage({
                ipcEvent: createSenderFrame(SCAM_URL),
                dirnameProvider: appImageDirnameProvider,
            });
        };

        expect(subject).toThrow('Hostname www.scam.com found, must be empty');

        process.env.NODE_ENV = original;
    });
});
