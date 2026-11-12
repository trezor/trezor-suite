import { createDeferred } from '@trezor/utils';

import { type ConnectImpl, TrezorConnectDynamic } from './dynamic';
import { ERRORS } from '../constants';
import { type MethodResponseMessage, createErrorMessage, createResponseMessage } from '../events';

const manifest = { email: 'test@test.com', appUrl: 'https://test.com', appName: 'Test App' };

const mockImpl = (): jest.Mocked<ConnectImpl> => ({
    init: jest.fn<ReturnType<ConnectImpl['init']>, Parameters<ConnectImpl['init']>>(() =>
        Promise.resolve(),
    ),
    call: jest.fn<ReturnType<ConnectImpl['call']>, Parameters<ConnectImpl['call']>>(() =>
        Promise.resolve(createResponseMessage('0', true, {})),
    ),
    cancel: jest.fn(),
    dispose: jest.fn(),
});

const desktopMissing = () =>
    Promise.resolve(createErrorMessage(ERRORS.TypedError('Desktop_ConnectionMissing')));

const setup = async () => {
    const desktop = mockImpl();
    const web = mockImpl();
    const connect = new TrezorConnectDynamic({
        implementations: { 'core-in-suite-desktop': desktop, 'core-in-suite-web': web },
    });
    await connect.init({ manifest, coreMode: 'auto' });

    // Desktop is gone, so the first call falls back to web.
    desktop.call.mockImplementation(desktopMissing);
    desktop.init.mockRejectedValue(ERRORS.TypedError('Desktop_ConnectionMissing'));
    await connect.call({ method: 'getFeatures' });
    desktop.init.mockClear();
    desktop.call.mockClear();
    web.call.mockClear();

    return { connect, desktop, web };
};

describe('TrezorConnectDynamic', () => {
    it('falls back to web when desktop is missing', async () => {
        const { connect, desktop, web } = await setup();

        await connect.call({ method: 'getFeatures' });

        expect(desktop.init).toHaveBeenCalledTimes(1);
        expect(web.call).toHaveBeenCalledTimes(1);
    });

    it('checks desktop availability once per batch of concurrent calls', async () => {
        const { connect, desktop } = await setup();

        const first = connect.call({ method: 'getFeatures' });
        await Promise.resolve();
        const second = connect.call({ method: 'getFeatures' });
        await Promise.all([first, second]);

        expect(desktop.init).toHaveBeenCalledTimes(1);
    });

    it('checks desktop availability again after overlapping calls settle', async () => {
        const { connect, desktop, web } = await setup();
        const firstResponse = createDeferred<MethodResponseMessage>();
        web.call.mockReturnValueOnce(firstResponse.promise);

        const first = connect.call({ method: 'getFeatures' });
        // The first call is still waiting for its response when the second one starts.
        await new Promise(resolve => setTimeout(resolve, 0));
        const second = connect.call({ method: 'getFeatures' });
        await second;
        firstResponse.resolve(createResponseMessage('0', true, {}));
        await first;
        desktop.init.mockClear();

        await connect.call({ method: 'getFeatures' });

        expect(desktop.init).toHaveBeenCalledTimes(1);
    });

    it('lets concurrent calls wait until the target switch finishes', async () => {
        const { connect, desktop, web } = await setup();
        desktop.init.mockResolvedValue(undefined);
        desktop.call.mockResolvedValue(createResponseMessage('0', true, {}));

        await Promise.all([
            connect.call({ method: 'getFeatures' }),
            connect.call({ method: 'getFeatures' }),
        ]);

        expect(desktop.call).toHaveBeenCalledTimes(2);
        expect(web.call).not.toHaveBeenCalled();
    });

    it('keeps the new target when disposing the old one fails', async () => {
        const { connect, desktop, web } = await setup();
        desktop.init.mockResolvedValue(undefined);
        desktop.call.mockResolvedValue(createResponseMessage('0', true, {}));
        web.dispose.mockImplementation(() => {
            throw new Error('dispose failed');
        });

        await connect.call({ method: 'getFeatures' });
        await connect.call({ method: 'getFeatures' });

        expect(desktop.call).toHaveBeenCalledTimes(2);
        expect(web.call).not.toHaveBeenCalled();
    });
});
