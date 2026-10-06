import { CALL_SOURCE_WEB, type ConnectCallSource } from './connectPopupTypes';
import { isConnectV9Source } from './connectV9';

const webSource = (npmVersion?: string): ConnectCallSource => ({
    type: CALL_SOURCE_WEB,
    origin: 'https://example.com',
    manifest: { appName: 'App', npmVersion },
});

describe('isConnectV9Source', () => {
    it.each<[string, ConnectCallSource, boolean]>([
        ['the manifest of a Connect 9 app', webSource('9.7.3'), true],
        ['the manifest of a Connect 10 app', webSource('10.0.0'), false],
        ['a manifest without an npm version', webSource(), false],
    ])('reads %s', (_, source, expected) => {
        expect(isConnectV9Source(source)).toBe(expected);
    });
});
