import { CALL_SOURCE_DEEPLINK, CALL_SOURCE_WEB, type ConnectCallSource } from './connectPopupTypes';
import {
    type ConnectV9Deeplink,
    getConnectAnalyticsNpmVersion,
    getConnectV9Deeplink,
    isCertainConnectV9Source,
    isConnectV9Source,
} from './connectV9';

// The base URLs Suite mobile accepts. Only the production ones name the Connect major, the other
// two are taken by develop and debug builds (see useConnectPopupNavigation).
const CONNECT_V9_URL = 'https://connect.trezor.io/9/deeplink/1/';
const CONNECT_V10_URL = 'https://connect.trezor.io/10/deeplink/1/';
const APP_SCHEME_URL = 'trezorsuite://connect/1/';
const DEV_URL = 'https://dev.suite.sldev.cz/connect/develop/deeplink/1/';

const deeplinkSource = (isConnectV9Guess: Partial<ConnectV9Deeplink> = {}): ConnectCallSource => ({
    type: CALL_SOURCE_DEEPLINK,
    origin: 'myapp://callback',
    manifest: { appName: 'App' },
    ...isConnectV9Guess,
});

const webSource = (npmVersion?: string): ConnectCallSource => ({
    type: CALL_SOURCE_WEB,
    origin: 'https://example.com',
    manifest: { appName: 'App', npmVersion },
});

describe('getConnectV9Deeplink', () => {
    it.each<[string, string, ConnectV9Deeplink]>([
        [
            'major 9 and a counter id',
            CONNECT_V9_URL,
            { isConnectV9: true, isConnectV9Certain: true },
        ],
        [
            'major 10 and a counter id',
            CONNECT_V10_URL,
            { isConnectV9: false, isConnectV9Certain: false },
        ],
        // Without a major the counter id is all there is, so the app is guessed, never known.
        [
            'no major and a counter id',
            APP_SCHEME_URL,
            { isConnectV9: true, isConnectV9Certain: false },
        ],
        [
            'a develop URL and a counter id',
            DEV_URL,
            { isConnectV9: true, isConnectV9Certain: false },
        ],
    ])('reads %s', (_, url, expected) => {
        expect(
            getConnectV9Deeplink({
                deeplinkUrl: new URL(url),
                callbackUrl: new URL('myapp://callback?id=12'),
            }),
        ).toEqual(expected);
    });

    it.each<[string, string]>([
        ['a UUID', '550e8400-e29b-41d4-a716-446655440000'],
        ['a timestamp', '1761500000000'],
        ['an opaque string', 'call-1'],
    ])('does not read an app that numbers its calls with %s as Connect 9', (_, id) => {
        expect(
            getConnectV9Deeplink({
                deeplinkUrl: new URL(APP_SCHEME_URL),
                callbackUrl: new URL(`myapp://callback?id=${id}`),
            }),
        ).toEqual({ isConnectV9: false, isConnectV9Certain: false });
    });

    it('does not read a call without an id as Connect 9', () => {
        expect(
            getConnectV9Deeplink({
                deeplinkUrl: new URL(CONNECT_V9_URL),
                callbackUrl: new URL('myapp://callback'),
            }),
        ).toEqual({ isConnectV9: false, isConnectV9Certain: false });
    });
});

describe('isConnectV9Source', () => {
    it.each<[string, ConnectCallSource, boolean]>([
        ['the manifest of a Connect 9 app', webSource('9.7.3'), true],
        ['the manifest of a Connect 10 app', webSource('10.0.0'), false],
        ['a manifest without an npm version', webSource(), false],
        ['a deeplink call guessed to be Connect 9', deeplinkSource({ isConnectV9: true }), true],
        ['a deeplink call that is not', deeplinkSource({ isConnectV9: false }), false],
    ])('reads %s', (_, source, expected) => {
        expect(isConnectV9Source(source)).toBe(expected);
    });
});

describe('isCertainConnectV9Source', () => {
    it.each<[string, ConnectCallSource, boolean]>([
        ['the manifest of a Connect 9 app', webSource('9.7.3'), true],
        ['the manifest of a Connect 10 app', webSource('10.0.0'), false],
        [
            'a deeplink call that names major 9',
            deeplinkSource({ isConnectV9: true, isConnectV9Certain: true }),
            true,
        ],
        // The guess drives the notice and the analytics, but never declines a call.
        [
            'a deeplink call only guessed to be Connect 9',
            deeplinkSource({ isConnectV9: true, isConnectV9Certain: false }),
            false,
        ],
    ])('reads %s', (_, source, expected) => {
        expect(isCertainConnectV9Source(source)).toBe(expected);
    });
});

describe('getConnectAnalyticsNpmVersion', () => {
    it('reports a deeplink call from a Connect 9 app as 9.x', () => {
        expect(getConnectAnalyticsNpmVersion(deeplinkSource({ isConnectV9: true }))).toBe('9.x');
    });

    it('reports the npm version from the manifest as it is', () => {
        expect(getConnectAnalyticsNpmVersion(webSource('9.7.3'))).toBe('9.7.3');
    });

    it('reports no version for a deeplink call from another app', () => {
        expect(getConnectAnalyticsNpmVersion(deeplinkSource())).toBeUndefined();
    });
});
