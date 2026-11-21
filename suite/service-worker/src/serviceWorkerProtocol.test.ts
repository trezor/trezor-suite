import { SERVICE_WORKER_FILE_NAME } from '../bundler';
import { SERVICE_WORKER_SCRIPT_NAME } from './serviceWorkerProtocol';

describe('serviceWorkerProtocol', () => {
    it('registers the script the bundlers emit', () => {
        expect(SERVICE_WORKER_SCRIPT_NAME).toBe(SERVICE_WORKER_FILE_NAME);
    });
});
