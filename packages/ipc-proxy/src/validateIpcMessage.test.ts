import { type ElectronIpcMainInvokeEvent } from './types';
import { validateIpcMessage } from './validateIpcMessage';

const createSenderFrame = (url: string, destroyed?: boolean): ElectronIpcMainInvokeEvent => ({
    senderFrame: { url: encodeURI(url), isDestroyed: () => destroyed === true },
});

const withNodeEnv = (nodeEnv: string, subject: () => void) => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = nodeEnv;
    try {
        subject();
    } finally {
        process.env.NODE_ENV = original;
    }
};

describe(validateIpcMessage.name, () => {
    it('passes when in DEV (localhost:8000)', () => {
        validateIpcMessage({ ipcEvent: createSenderFrame('http://localhost:8000/') });
    });

    it('passes in PROD: the renderer served over the suite scheme', () => {
        withNodeEnv('production', () => {
            validateIpcMessage({ ipcEvent: createSenderFrame('suite://app/index.html') });
            validateIpcMessage({ ipcEvent: createSenderFrame('suite://app/index.html?x=1#top') });
        });
    });

    it('errors when in PROD and on localhost:8000', () => {
        withNodeEnv('production', () => {
            const subject = () => {
                validateIpcMessage({ ipcEvent: createSenderFrame('http://localhost:8000/') });
            };

            expect(subject).toThrow(
                'Invalid ipcEvent.senderFrame.url: "http://localhost:8000/", only "suite://app/index.html" is allowed',
            );
        });
    });

    it('errors for a page loaded from disk, which was the sender before the suite scheme', () => {
        const senderUrl = 'file:///tmp/.mount_TrezorXsQUqQ/resources/app.asar/build/index.html';

        const subject = () => {
            validateIpcMessage({ ipcEvent: createSenderFrame(senderUrl) });
        };

        expect(subject).toThrow('Invalid ipcEvent.senderFrame.url');
    });

    it('errors for other pages served over the suite scheme', () => {
        [
            'suite://app/legacy-origin-storage.html',
            'suite://app/',
            'suite://other/index.html',
        ].forEach(senderUrl => {
            const subject = () => {
                validateIpcMessage({ ipcEvent: createSenderFrame(senderUrl) });
            };

            expect(subject).toThrow('Invalid ipcEvent.senderFrame.url');
        });
    });

    it('errors for malicious URL', () => {
        const subject = () => {
            validateIpcMessage({ ipcEvent: createSenderFrame('https://www.irs.gov/') });
        };

        expect(subject).toThrow('Invalid ipcEvent.senderFrame.url: "https://www.irs.gov/"');
    });

    it('errors for invalid senderFrame', () => {
        const subjectWithEmptyEvent = () => {
            validateIpcMessage({ ipcEvent: {} as any });
        };
        const subjectWithEmptySenderFrame = () => {
            const ipcEvent = createSenderFrame('http://localhost:8000/');
            delete (ipcEvent.senderFrame as any).url;
            validateIpcMessage({ ipcEvent });
        };

        expect(subjectWithEmptyEvent).toThrow('Invalid ipcEvent: {}');
        expect(subjectWithEmptySenderFrame).toThrow('Invalid ipcEvent: {"senderFrame":{}}');
    });

    it('errors when in production, you get a different scheme with the right path', () => {
        withNodeEnv('production', () => {
            const SCAM_URL = 'https://www.scam.com/index.html';

            const subject = () => {
                validateIpcMessage({ ipcEvent: createSenderFrame(SCAM_URL) });
            };

            expect(subject).toThrow(
                'Invalid ipcEvent.senderFrame.url: "https://www.scam.com/index.html"',
            );
        });
    });
});
