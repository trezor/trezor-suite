import { TrezorConnectDeeplink } from './index';

const CALLBACK_URL = 'integratorapp://connect';
const PENDING = 'pending';

const getSettledValue = <T>(promise: Promise<T>) =>
    Promise.race([
        promise,
        new Promise<typeof PENDING>(resolve => setTimeout(resolve, 0, PENDING)),
    ]);

const initConnect = async (deeplinkCallbackUrl = CALLBACK_URL) => {
    let openedUrl = '';
    const connect = new TrezorConnectDeeplink();
    await connect.init({
        manifest: { email: 'dev@example.com', appUrl: 'https://example.com', appName: 'Example' },
        deeplinkOpen: url => {
            openedUrl = url;
        },
        deeplinkCallbackUrl,
    });

    const startCall = () => {
        const promise = connect.call({ method: 'getPublicKey', path: "m/44'/0'/0'" });
        const callbackUrl = new URL(openedUrl).searchParams.get('callback') ?? '';

        return { promise, id: new URL(callbackUrl).searchParams.get('id') ?? '' };
    };

    return { connect, startCall };
};

const getResponseUrl = (baseUrl: string, id: string, response: string) => {
    const url = new URL(baseUrl);
    url.searchParams.set('id', id);
    url.searchParams.set('response', response);

    return url.toString();
};

const SUCCESS_RESPONSE = JSON.stringify({ success: true, payload: { xpub: 'xpub-value' } });

describe('TrezorConnectDeeplink.handleDeeplink', () => {
    it.each(['null', '1'])(
        'settles the call with an error when its response %s is not a JSON object',
        async response => {
            const { connect, startCall } = await initConnect();
            const { promise, id } = startCall();

            expect(() =>
                connect.handleDeeplink(getResponseUrl(CALLBACK_URL, id, response)),
            ).not.toThrow();
            expect(await getSettledValue(promise)).toEqual({
                id,
                success: false,
                error: 'Error parsing deeplink params.',
            });
        },
    );

    it('does not throw for a malformed response of an unknown call', async () => {
        const { connect } = await initConnect();

        expect(() =>
            connect.handleDeeplink(getResponseUrl(CALLBACK_URL, 'unknown', 'not-json')),
        ).not.toThrow();
    });

    it.each([
        ['integratorapp://connect', 'integratorapp://connect'],
        ['integratorapp:///connect', 'integratorapp:///connect'],
        ['integratorapp://Connect', 'INTEGRATORAPP://connect'],
        ['https://example.com/callback', 'https://example.com/callback/'],
        ['http://localhost:8080/connect/', 'http://localhost:8080/connect/'],
    ])(
        'resolves the call with a response for callback %s at %s',
        async (callback, responseBase) => {
            const { connect, startCall } = await initConnect(callback);
            const { promise, id } = startCall();

            connect.handleDeeplink(getResponseUrl(responseBase, id, SUCCESS_RESPONSE));

            expect(await getSettledValue(promise)).toEqual({
                id,
                success: true,
                payload: { xpub: 'xpub-value' },
            });
        },
    );

    it.each([
        [CALLBACK_URL, 'otherapp://connect'],
        [CALLBACK_URL, 'integratorapp://other'],
        [CALLBACK_URL, 'integratorapp://connect/other'],
        ['https://example.com/callback', 'https://example.com:8443/callback'],
    ])('ignores a response for callback %s at %s', async (callback, responseBase) => {
        const { connect, startCall } = await initConnect(callback);
        const { promise, id } = startCall();

        connect.handleDeeplink(getResponseUrl(responseBase, id, SUCCESS_RESPONSE));

        expect(await getSettledValue(promise)).toBe(PENDING);
    });

    it.each([CALLBACK_URL, 'integratorapp://other?uri=value', 'not a url'])(
        'keeps pending calls for a deeplink that names no call: %s',
        async url => {
            const { connect, startCall } = await initConnect();
            const { promise } = startCall();

            connect.handleDeeplink(url);

            expect(await getSettledValue(promise)).toBe(PENDING);
        },
    );

    it('keeps pending calls when the query of a deeplink cannot be decoded', async () => {
        const { connect, startCall } = await initConnect();
        const { promise, id } = startCall();
        const responseUrl = getResponseUrl(CALLBACK_URL, id, SUCCESS_RESPONSE);
        // Some URL implementations (e.g. React Native's) throw while decoding a malformed query.
        const searchParamsSpy = jest
            .spyOn(URL.prototype, 'searchParams', 'get')
            .mockImplementation(() => {
                throw new URIError('URI malformed');
            });

        expect(() => connect.handleDeeplink(responseUrl)).not.toThrow();
        searchParamsSpy.mockRestore();
        expect(await getSettledValue(promise)).toBe(PENDING);
    });
});
