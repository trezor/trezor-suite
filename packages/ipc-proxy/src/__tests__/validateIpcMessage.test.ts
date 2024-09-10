import { ElectronIpcMainInvokeEvent } from '../proxy-handler';
import { validateIpcMessage } from '../validateIpcMessage';

const createSenderFrame = (url: string) => ({ senderFrame: { url } });

describe(validateIpcMessage.name, () => {
    it('passes when in DEV (localhost.8000)', () => {
        validateIpcMessage(createSenderFrame('http://localhost:8000/'));
    });

    it('passes in PROD (file:///index.html )', () => {
        validateIpcMessage(createSenderFrame('file:///index.html'));
    });

    it('fails when not in PROD environment and is on (localhost.8000)', () => {
        const original = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const subject = () => {
            validateIpcMessage(createSenderFrame('http://localhost:8000/'));
        };

        expect(subject).toThrow('Invalid ipcEvent.senderFrame.url: "http://localhost:8000/"');

        process.env.NODE_ENV = original;
    });

    it('fails for malicious URL', () => {
        const subject = () => {
            validateIpcMessage(createSenderFrame('https://www.irs.gov/'));
        };

        expect(subject).toThrow('Invalid ipcEvent.senderFrame.url: "https://www.irs.gov/"');
    });

    it('fails for invalid senderFrame', () => {
        const subject = () => {
            validateIpcMessage({} as ElectronIpcMainInvokeEvent);
        };

        expect(subject).toThrow('Invalid ipcEvent: {}');
    });
});
