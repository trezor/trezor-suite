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
});
