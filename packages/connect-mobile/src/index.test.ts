import TrezorConnect from './index';

const manifest = {
    email: 'developer@example.com',
    appName: 'Connect Mobile Test',
    appUrl: 'https://example.com',
};
const deeplinkOpen = jest.fn((_url: string): void => {});

const callbackUrl = (requestIndex = 0) => {
    const request = new URL(deeplinkOpen.mock.calls[requestIndex]![0]);

    return new URL(request.searchParams.get('callback')!);
};

const respond = (response: unknown, requestIndex = 0) => {
    const callback = callbackUrl(requestIndex);
    callback.searchParams.set('response', JSON.stringify(response));
    TrezorConnect.handleDeeplink(callback.toString());
};

const initialize = () =>
    TrezorConnect.init({
        manifest,
        deeplinkOpen,
        deeplinkCallbackUrl: 'exampleapp://trezor-callback',
    });

describe('@trezor/connect-mobile', () => {
    beforeEach(async () => {
        await TrezorConnect.dispose();
        deeplinkOpen.mockReset();
        await initialize();
    });

    afterEach(async () => {
        await TrezorConnect.dispose();
    });

    it('keeps the public method and production URL unchanged', async () => {
        const response = TrezorConnect.getFeatures();
        const request = new URL(deeplinkOpen.mock.calls[0]![0]);

        expect(request.origin).toBe('https://connect.trezor.io');
        expect(request.pathname).toBe('/10/deeplink/1/');
        expect(request.searchParams.get('method')).toBe('getFeatures');
        expect(JSON.parse(request.searchParams.get('params')!)).toEqual({});
        respond({ success: true, payload: { model: 'T3W1' } });
        await expect(response).resolves.toMatchObject({ success: true });
    });

    it('preserves the successful payload and device identity', async () => {
        const response = TrezorConnect.getFeatures();
        const payload = { model: 'T3W1' };
        const device = { path: 'test-device', instance: 0, state: { sessionId: 'test-session' } };

        respond({ success: true, payload, device });

        await expect(response).resolves.toEqual({
            id: callbackUrl().searchParams.get('id'),
            success: true,
            payload,
            device,
        });
    });

    it.each([null, false, 0, '', [], [{ address: 'test-address' }]])(
        'preserves a valid payload %p',
        async payload => {
            const response = TrezorConnect.getFeatures();
            respond({ success: true, payload });

            await expect(response).resolves.toMatchObject({ success: true, payload });
        },
    );

    it('preserves structured errors and device identity', async () => {
        const response = TrezorConnect.getFeatures();
        const error = { code: 'Device_Disconnected', message: 'Device disconnected' };
        const device = { path: 'test-device', instance: 0 };

        respond({ success: false, error, device });

        await expect(response).resolves.toEqual({
            id: callbackUrl().searchParams.get('id'),
            success: false,
            error,
            device,
        });
    });

    it('uses the callback request ID instead of an ID inside the response', async () => {
        const response = TrezorConnect.getFeatures();
        respond({ id: 'another-request', success: true, payload: { model: 'T3W1' } });

        await expect(response).resolves.toMatchObject({
            id: callbackUrl().searchParams.get('id'),
            success: true,
        });
    });

    it.each([
        null,
        [],
        true,
        1,
        'response',
        {},
        { success: 'true', payload: {} },
        { success: true },
        { success: false },
        { success: false, error: 'failure' },
        { success: false, error: { code: 1, message: 'failure' } },
        { success: false, error: { code: 'Runtime', message: 1 } },
        { success: true, payload: {}, device: [] },
    ])('rejects an invalid response envelope %p', async frame => {
        const response = TrezorConnect.getFeatures();

        expect(() => respond(frame)).not.toThrow();
        await expect(response).resolves.toMatchObject({
            success: false,
            error: { code: 'Method_InvalidParameter' },
        });
    });

    it('rejects malformed JSON without throwing from the callback listener', async () => {
        const response = TrezorConnect.getFeatures();
        const callback = callbackUrl();
        callback.searchParams.set('response', '{');

        expect(() => TrezorConnect.handleDeeplink(callback.toString())).not.toThrow();
        await expect(response).resolves.toMatchObject({
            success: false,
            error: { code: 'Method_InvalidParameter' },
        });
    });

    it('rejects a missing response', async () => {
        const response = TrezorConnect.getFeatures();
        TrezorConnect.handleDeeplink(callbackUrl().toString());

        await expect(response).resolves.toMatchObject({
            success: false,
            error: { code: 'Method_InvalidParameter' },
        });
    });

    it.each(['id', 'response'])('rejects duplicate %s parameters', async parameter => {
        const response = TrezorConnect.getFeatures();
        const callback = callbackUrl();
        callback.searchParams.set('response', JSON.stringify({ success: true, payload: {} }));
        callback.searchParams.append(parameter, callback.searchParams.get(parameter)!);
        TrezorConnect.handleDeeplink(callback.toString());

        await expect(response).resolves.toMatchObject({
            success: false,
            error: { code: 'Method_InvalidParameter' },
        });
    });

    it('does not resolve another request for an unknown callback ID', async () => {
        const response = TrezorConnect.getFeatures();
        const callback = callbackUrl();
        callback.searchParams.set('id', 'unknown-request');
        callback.searchParams.set('response', JSON.stringify({ success: true, payload: {} }));
        TrezorConnect.handleDeeplink(callback.toString());
        respond({ success: true, payload: { model: 'T3W1' } });

        await expect(response).resolves.toMatchObject({ payload: { model: 'T3W1' } });
    });

    it('settles every cancelled call using the standard failure shape', async () => {
        const first = TrezorConnect.getFeatures();
        const second = TrezorConnect.getFeatures();
        TrezorConnect.cancel({ reason: 'User cancelled' });

        for (const response of [first, second]) {
            await expect(response).resolves.toMatchObject({
                success: false,
                error: { code: 'Method_Cancel', message: 'User cancelled' },
            });
        }
    });

    it.each([undefined, 'User cancelled'])(
        'keeps legacy cancellation with reason %p',
        async reason => {
            const response = TrezorConnect.getFeatures();
            TrezorConnect.cancel(reason);

            await expect(response).resolves.toMatchObject({
                success: false,
                error: { code: 'Method_Cancel', message: reason ?? 'Canceled' },
            });
        },
    );

    it('settles pending calls on disposal and fences a late callback after reinitialization', async () => {
        const oldResponse = TrezorConnect.getFeatures();
        await TrezorConnect.dispose();
        await expect(oldResponse).resolves.toMatchObject({
            success: false,
            error: { code: 'Method_Interrupted' },
        });

        await initialize();
        const response = TrezorConnect.getFeatures();
        respond({ success: true, payload: { model: 'old-device' } });
        respond({ success: true, payload: { model: 'current-device' } }, 1);
        await expect(response).resolves.toMatchObject({ payload: { model: 'current-device' } });
    });

    it('returns an initialization failure after disposal', async () => {
        await TrezorConnect.dispose();

        await expect(TrezorConnect.getFeatures()).resolves.toMatchObject({
            success: false,
            error: { code: 'Init_NotInitialized' },
        });
    });

    it('settles a synchronously failed open and permits the next call', async () => {
        deeplinkOpen.mockImplementationOnce(() => {
            throw new Error('Unable to open Suite');
        });

        await expect(TrezorConnect.getFeatures()).resolves.toMatchObject({
            success: false,
            error: { message: 'Unable to open Suite' },
        });

        const response = TrezorConnect.getFeatures();
        respond({ success: true, payload: { model: 'T3W1' } }, 1);
        await expect(response).resolves.toMatchObject({ success: true });
    });

    it('settles an asynchronously failed open', async () => {
        deeplinkOpen.mockImplementationOnce(() =>
            Promise.reject(new Error('Unable to open Suite')),
        );

        await expect(TrezorConnect.getFeatures()).resolves.toMatchObject({
            success: false,
            error: { message: 'Unable to open Suite' },
        });
    });

    it('only settles the call whose open failed', async () => {
        const first = TrezorConnect.getFeatures();
        deeplinkOpen.mockImplementationOnce(() =>
            Promise.reject(new Error('Unable to open Suite')),
        );
        const second = TrezorConnect.getFeatures();

        await expect(second).resolves.toMatchObject({ success: false });
        respond({ success: true, payload: { model: 'T3W1' } });
        await expect(first).resolves.toMatchObject({ success: true });
    });

    it('accepts a callback before an asynchronous open finishes', async () => {
        let rejectOpen: (reason: Error) => void = () => {};
        deeplinkOpen.mockImplementationOnce(
            () =>
                new Promise<void>((_resolve, reject) => {
                    rejectOpen = reject;
                }),
        );
        const response = TrezorConnect.getFeatures();
        respond({ success: true, payload: { model: 'T3W1' } });
        await expect(response).resolves.toMatchObject({ success: true });

        rejectOpen(new Error('Late open failure'));
        await expect(response).resolves.toMatchObject({ success: true });
    });
});
