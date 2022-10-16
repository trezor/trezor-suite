import fixtures from './fixtures/encodeDataToQueryString';
import { encodeDataToQueryString, getRandomId } from '../utils';
import { Analytics } from '../analytics';

jest.mock('@trezor/utils', () => ({
    __esModule: true,
    getWeakRandomId: () => 'random',
}));

describe('analytics', () => {
    afterAll(() => {
        jest.clearAllMocks();
    });

    it('should report if enabled and do not report when disabled', () => {
        const mockFetchPromise = Promise.resolve({
            json: () => Promise.resolve({}),
        });
        global.fetch = jest.fn().mockImplementation(() => mockFetchPromise);
        // @ts-expect-error
        jest.spyOn(global, 'fetch').mockImplementation(() => mockFetchPromise);

        const timestamp = new Date().getTime();
        jest.spyOn(Date, 'now').mockImplementation(() => timestamp);
        jest.spyOn(console, 'error').mockImplementation(() => {});

        const app = 'suite';
        const environment = 'desktop';
        const isDev = true;
        const instanceId = getRandomId();
        const sessionId = getRandomId();
        const commitId = 'abc';

        const analytics = new Analytics('1.18', app);

        analytics.init(true, { environment, isDev, instanceId, sessionId, commitId });

        const actionType = 'very-important-action';

        analytics.report({ type: actionType });

        expect(global.fetch).toHaveBeenNthCalledWith(
            1,
            `https://data.trezor.io/${app}/log/${environment}/develop.log?c_v=1.18&c_type=${actionType}&c_commit=${commitId}&c_instance_id=${instanceId}&c_session_id=${sessionId}&c_timestamp=${timestamp}&c_message_id=random`,
            { method: 'GET' },
        );
        expect(global.fetch).toHaveBeenCalledTimes(1);

        analytics.disable();
        analytics.report({ type: actionType });

        expect(global.fetch).toHaveBeenCalledTimes(1);

        analytics.enable();
        analytics.report({ type: actionType });

        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should report even without environment option', () => {
        const mockFetchPromise = Promise.resolve({
            json: () => Promise.resolve({}),
        });
        global.fetch = jest.fn().mockImplementation(() => mockFetchPromise);
        // @ts-expect-error
        jest.spyOn(global, 'fetch').mockImplementation(() => mockFetchPromise);

        const timestamp = new Date().getTime();
        jest.spyOn(Date, 'now').mockImplementation(() => timestamp);
        jest.spyOn(console, 'error').mockImplementation(() => {});

        const app = 'connect';
        const isDev = false;
        const instanceId = getRandomId();
        const sessionId = getRandomId();
        const commitId = 'abc';

        const analytics = new Analytics('1.18', app);

        analytics.init(true, { isDev, instanceId, sessionId, commitId });

        const actionType = 'very-important-action';

        analytics.report({ type: actionType });

        expect(global.fetch).toHaveBeenNthCalledWith(
            1,
            `https://data.trezor.io/${app}/log/stable.log?c_v=1.18&c_type=${actionType}&c_commit=${commitId}&c_instance_id=${instanceId}&c_session_id=${sessionId}&c_timestamp=${timestamp}&c_message_id=random`,
            { method: 'GET' },
        );
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('calls callback on enable and disable', () => {
        jest.spyOn(console, 'log').mockImplementation(() => {});

        const app = 'suite';
        const environment = 'desktop';
        const isDev = true;
        const instanceId = getRandomId();
        const sessionId = getRandomId();
        const commitId = 'abc';

        const analytics = new Analytics('1.18', app);
        analytics.init(false, {
            environment,
            isDev,
            instanceId,
            sessionId,
            commitId,
            callbacks: {
                onDisable: () => console.log('disabled'),
                onEnable: () => console.log('enabled'),
            },
        });

        expect(analytics.isEnabled()).toBeFalsy();

        analytics.enable();
        expect(analytics.isEnabled()).toBeTruthy();
        expect(console.log).toHaveBeenLastCalledWith('enabled');

        analytics.disable();
        expect(analytics.isEnabled()).toBeFalsy();
        expect(console.log).toHaveBeenLastCalledWith('disabled');
    });

    fixtures.forEach(f => {
        it(f.data.type, () => {
            jest.spyOn(Date, 'now').mockImplementation(() => new Date(f.currentDate).getTime());

            expect(
                encodeDataToQueryString(f.instanceId, f.sessionId, f.commitId, f.version, f.data),
            ).toEqual(f.encoded);
        });
    });
});
