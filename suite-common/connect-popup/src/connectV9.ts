import { CALL_SOURCE_DEEPLINK, type ConnectCallSource } from './connectPopupTypes';

/**
 * Whether the calling app uses `@trezor/connect` 9.x, according to the npm version in its
 * manifest. A deeplink call carries no npm version, so for it the result of isConnectV9Deeplink is
 * used.
 */
export const isConnectV9Source = (source: ConnectCallSource): boolean =>
    source.manifest.npmVersion?.startsWith('9.') === true ||
    (source.type === CALL_SOURCE_DEEPLINK && source.isConnectV9 === true);

// The Connect major version in the path of the deeplink, e.g. 9 in
// https://connect.trezor.io/9/deeplink/1/. Develop and debug builds also accept URLs without it.
const getDeeplinkConnectMajor = (deeplinkUrl: URL): number | undefined => {
    const pathSegments = deeplinkUrl.pathname.split('/');
    const majorSegment = pathSegments[pathSegments.indexOf('deeplink') - 1];

    return majorSegment !== undefined && /^\d+$/.test(majorSegment)
        ? Number(majorSegment)
        : undefined;
};

type IsConnectV9DeeplinkParams = {
    deeplinkUrl: URL;
    callbackUrl: URL;
};

/**
 * Whether a deeplink call comes from an app that uses `@trezor/connect-mobile` 9.x. Its calls have
 * a numeric id in the callback URL, while 10.x uses UUIDs, and they go to
 * https://connect.trezor.io/9/deeplink/ unless the app sets another `connectSrc`. A numeric id with
 * another major in the deeplink path does not count. A deeplink without a major is told apart by the
 * id only.
 */
export const isConnectV9Deeplink = ({
    deeplinkUrl,
    callbackUrl,
}: IsConnectV9DeeplinkParams): boolean => {
    const hasNumericCallId = /^\d+$/.test(callbackUrl.searchParams.get('id') ?? '');
    const deeplinkConnectMajor = getDeeplinkConnectMajor(deeplinkUrl);

    return hasNumericCallId && (deeplinkConnectMajor === undefined || deeplinkConnectMajor === 9);
};

/**
 * The npm version that the connect-popup analytics events report for the calling app. A deeplink
 * carries none, so a deeplink call from a Connect 9 app is reported as `9.x`.
 */
export const getConnectAnalyticsNpmVersion = (source: ConnectCallSource): string | undefined => {
    if (source.type === CALL_SOURCE_DEEPLINK && source.isConnectV9 === true) return '9.x';

    return source.manifest.npmVersion;
};
