import { type OnBeforeRequestListenerDetails, type Session } from 'electron';

import { denyLocalNetworkRequests, isLocalNetworkUrl } from './localNetwork';
import { Logger } from '../../../libs/logger';
import { type MockSession, mockSession } from '../mocks/mockSession';

jest.mock('electron', () => ({}));

describe(isLocalNetworkUrl.name, () => {
    it.each([
        'http://127.0.0.1:21335/oauth?code=1',
        'http://127.1.2.3/',
        'ws://localhost:21325/',
        'http://LOCALHOST/',
        'http://app.localhost/',
        'http://localhost./',
        'http://[::1]:8080/',
        'http://[::]/',
        'http://0.0.0.0:8000/',
        'http://10.0.0.5/',
        'http://100.64.0.1/',
        'http://169.254.169.254/latest/meta-data/',
        'http://172.16.0.1/',
        'http://172.31.255.255/',
        'http://192.168.1.1/',
        'http://2130706433/',
        'http://0x7f000001/',
        'http://127.1/',
        'http://[fe80::1]/',
        'http://[fd12:3456::1]/',
        'http://[fec0::1]/',
        'http://[::ffff:127.0.0.1]/',
        'http://[::ffff:192.168.0.1]/',
        'http://printer.local/',
        'http://nas.home.arpa/',
        'http://db.internal/',
        'wss://127.0.0.1/',
    ])('is true for %s', url => {
        expect(isLocalNetworkUrl(url)).toBe(true);
    });

    it.each([
        'https://example.com/',
        'https://check.torproject.org/',
        'http://trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion/',
        'https://[2606:4700::1111]/',
        'http://[2001:db8::1]/',
        'http://[::ffff:8.8.8.8]/',
        'http://8.8.8.8/',
        'http://11.0.0.1/',
        'http://100.128.0.1/',
        'http://172.32.0.1/',
        'http://localhost.example.com/',
        'http://internal.example.com/',
        'data:text/html,hello',
        'blob:https://example.com/0f5e',
        'not a url',
    ])('is false for %s', url => {
        expect(isLocalNetworkUrl(url)).toBe(false);
    });
});

describe(denyLocalNetworkRequests.name, () => {
    const logger = new Logger('mute');

    const createRequest = (url: string): OnBeforeRequestListenerDetails => ({
        id: 1,
        url,
        method: 'GET',
        resourceType: 'xhr',
        referrer: 'https://app.example/',
        timestamp: 0,
        uploadData: [],
    });

    const decide = (created: MockSession, url: string) => {
        const [registration] = jest.mocked(created.webRequest.onBeforeRequest).mock.calls;

        if (registration === undefined) {
            throw new Error('no request listener was installed');
        }

        const [listener] = registration;

        if (listener === null) {
            throw new Error('the request listener was removed');
        }

        const callback = jest.fn();

        listener(createRequest(url), callback);

        return callback;
    };

    it('cancels a request to the local network', () => {
        const created = mockSession();

        denyLocalNetworkRequests(created as Session, logger);

        expect(decide(created, 'http://127.0.0.1:21335/oauth')).toHaveBeenCalledWith({
            cancel: true,
        });
    });

    it('lets a request to the public internet through', () => {
        const created = mockSession();

        denyLocalNetworkRequests(created as Session, logger);

        expect(decide(created, 'https://pay.google.com/')).toHaveBeenCalledWith({});
    });
});
