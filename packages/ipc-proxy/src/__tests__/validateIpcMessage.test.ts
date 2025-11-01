import { ElectronIpcMainInvokeEvent } from '../proxy-handler';
import { validateIpcMessage } from '../validateIpcMessage';

const createSenderFrame = (url: string, destroyed?: boolean): ElectronIpcMainInvokeEvent => ({
    senderFrame: { url, isDestroyed: () => destroyed === true },
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
        const senderUrl =
            'file:///C:/Users/vm11-/Desktop/win-unpacked/resources/app.asar/build/index.html';

        validateIpcMessage({
            ipcEvent: createSenderFrame(senderUrl),
            dirnameProvider: () => 'C:/Users/vm11-/Desktop/win-unpacked/resources/app.asar/dist',
            platformProvider: () => 'win32',
        });
    });

    it('fails when not in PROD environment and is on (localhost.8000)', () => {
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

    it('fails for malicious URL', () => {
        const subject = () => {
            validateIpcMessage({
                ipcEvent: createSenderFrame('https://www.irs.gov/'),
                dirnameProvider: appImageDirnameProvider,
            });
        };

        expect(subject).toThrow('Hostname www.irs.gov found, must be empty');
    });

    it('fails for invalid senderFrame', () => {
        const subject = () => {
            validateIpcMessage({
                ipcEvent: {} as ElectronIpcMainInvokeEvent,
                dirnameProvider: appImageDirnameProvider,
            });
        };

        expect(subject).toThrow('Invalid ipcEvent: {}');
    });

    it('fails when senderFrame has been destroyed', () => {
        const subject = () => {
            validateIpcMessage({
                ipcEvent: createSenderFrame('http://localhost:8000/', true),
                dirnameProvider: appImageDirnameProvider,
            });
        };

        expect(subject).toThrow('ipcEvent.senderFrame is destroyed');
    });

    it('fails when in production, you get different protocol to file:', () => {
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
