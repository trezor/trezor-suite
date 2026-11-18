import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect, { type MethodInfo, type PermissionRequest } from '@trezor/connect';

import { CommonPopupFlow, type PopupFlowAnswer } from './CommonPopupFlow';
import { connectPopupActions } from '../connectPopupActions';

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    __esModule: true,
    default: { call: jest.fn(), updateConnectSettings: jest.fn() },
}));

const answer: PopupFlowAnswer = { success: true, payload: [] };

// A flow not backed by a Connect method, which describes and makes the call itself.
class PopupOnlyFlow extends CommonPopupFlow<'selectAccount'> {
    constructor(
        private readonly requiredPermissions: PermissionRequest[],
        appName = 'dapp',
    ) {
        super(
            {
                method: 'selectAccount',
                payload: { coin: 'btc' },
                source: {
                    type: 'walletconnect',
                    origin: 'https://dapp.example',
                    manifest: { appName },
                },
            },
            {
                dispatch: jest.fn(),
                getState: () => ({
                    connectPopup: { permissions: [] },
                    device: { selectedDevice: mockSuiteDevice({ connected: true }) },
                }),
            },
        );
    }

    protected getMethodInfo(): Promise<MethodInfo> {
        return Promise.resolve({
            info: 'Select account',
            requiredPermissions: this.requiredPermissions,
            useUi: true,
        });
    }

    protected callMethod() {
        return Promise.resolve(answer);
    }
}

describe('CommonPopupFlow', () => {
    it('runs a flow not backed by a Connect method without calling Connect', async () => {
        const flow = new PopupOnlyFlow([{ permission: 'read_xpub' }]);

        await expect(flow.run()).resolves.toBe(answer);
        expect(TrezorConnect.call).not.toHaveBeenCalled();
        expect(flow['dispatch']).toHaveBeenCalledWith(connectPopupActions.finishCall());
    });

    it('names the origin in the success toast of a caller without a name', async () => {
        const flow = new PopupOnlyFlow([{ permission: 'read_xpub' }], '');

        await flow.run();

        expect(flow['dispatch']).toHaveBeenCalledWith(
            expect.objectContaining({
                type: notificationsActions.addToast.type,
                payload: expect.objectContaining({
                    type: 'connect-popup-success',
                    appName: 'https://dapp.example',
                }),
            }),
        );
    });

    it('rejects a call requiring a forbidden permission however the flow describes it', async () => {
        const flow = new PopupOnlyFlow([{ permission: 'management' }]);

        await expect(flow.run()).rejects.toMatchObject({ code: 'Method_NotAllowed' });
    });
});
