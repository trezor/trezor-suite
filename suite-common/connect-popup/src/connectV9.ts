import { CALL_SOURCE_DEEPLINK, type ConnectCallSource } from './connectPopupTypes';

/**
 * Whether the calling app uses `@trezor/connect` 9.x, according to the npm version in its
 * manifest. A deeplink call carries no npm version, so for it the guess of getConnectV9Deeplink is
 * used. The guess may be wrong, so this answer drives the deprecation notice and the analytics
 * only; where a call depends on the answer, use isCertainConnectV9Source.
 */
export const isConnectV9Source = (source: ConnectCallSource): boolean =>
    source.manifest.npmVersion?.startsWith('9.') === true ||
    (source.type === CALL_SOURCE_DEEPLINK && source.isConnectV9 === true);

/**
 * Whether the call names Connect 9 itself, rather than being guessed to come from it: its manifest
 * has a 9.x npm version, or its deeplink goes to the major 9 path with a counter id. Besides
 * `@trezor/connect-mobile` 9.x, a hand-written integration that follows the Connect 9 deeplink
 * docs sends such deeplinks too, and it is treated the same. The shape of the call id alone is
 * never enough here, so a Connect 10 app that happens to number its calls is not declined.
 */
export const isCertainConnectV9Source = (source: ConnectCallSource): boolean =>
    source.manifest.npmVersion?.startsWith('9.') === true ||
    (source.type === CALL_SOURCE_DEEPLINK && source.isConnectV9Certain === true);

// The Connect major version in the path of a production deeplink, e.g. 9 in
// https://connect.trezor.io/9/deeplink/1/. The other hosts, which only develop and debug builds
// accept, name no major: the develop URL has a branch name in that place.
const getDeeplinkConnectMajor = (deeplinkUrl: URL): number | undefined => {
    if (deeplinkUrl.hostname !== 'connect.trezor.io') return undefined;

    const pathSegments = deeplinkUrl.pathname.split('/');
    const majorSegment = pathSegments[pathSegments.indexOf('deeplink') - 1];

    return majorSegment !== undefined && /^\d+$/.test(majorSegment)
        ? Number(majorSegment)
        : undefined;
};

type GetConnectV9DeeplinkParams = {
    deeplinkUrl: URL;
    callbackUrl: URL;
};

export type ConnectV9Deeplink = {
    // The app is read as a Connect 9 one, which may rest on the call id alone.
    isConnectV9: boolean;
    // The deeplink itself names major 9, so no guess is involved.
    isConnectV9Certain: boolean;
};

// The call id of @trezor/connect-mobile 9.x is the counter it increments per call, so an id of
// another shape, for example the timestamp or the UUID that a hand-written integration may use,
// is not read as Connect 9.
const CONNECT_V9_CALL_ID = /^\d{1,6}$/;

/**
 * Whether a deeplink call comes from an app that uses `@trezor/connect-mobile` 9.x. Its calls have
 * a counter id in the callback URL, while 10.x uses UUIDs, and they go to
 * https://connect.trezor.io/9/deeplink/ unless the app sets another `connectSrc`. A counter id with
 * another major in the deeplink path does not count. A deeplink without a major, which only develop
 * and debug builds accept, is told apart by the id alone. The id belongs to the app, so that is a
 * hint for the deprecation notice, never a boundary an app must not cross — only the certain
 * answer, the major in the path, declines a call. A hand-written integration that follows the
 * Connect 9 deeplink docs, with the major 9 path and a numeric id, is read as Connect 9 as well.
 */
export const getConnectV9Deeplink = ({
    deeplinkUrl,
    callbackUrl,
}: GetConnectV9DeeplinkParams): ConnectV9Deeplink => {
    const hasCounterCallId = CONNECT_V9_CALL_ID.test(callbackUrl.searchParams.get('id') ?? '');
    const deeplinkConnectMajor = getDeeplinkConnectMajor(deeplinkUrl);

    return {
        isConnectV9:
            hasCounterCallId && (deeplinkConnectMajor === undefined || deeplinkConnectMajor === 9),
        isConnectV9Certain: hasCounterCallId && deeplinkConnectMajor === 9,
    };
};

/**
 * The npm version that the connect-popup analytics events report for the calling app. A deeplink
 * carries none, so a deeplink call from a Connect 9 app is reported as `9.x`.
 */
export const getConnectAnalyticsNpmVersion = (source: ConnectCallSource): string | undefined => {
    if (source.type === CALL_SOURCE_DEEPLINK && source.isConnectV9 === true) return '9.x';

    return source.manifest.npmVersion;
};
