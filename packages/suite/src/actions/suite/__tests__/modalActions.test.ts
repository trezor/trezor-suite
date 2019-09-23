import * as modalActions from '../modalActions';
import { MODAL, SUITE } from '../constants';

jest.mock('trezor-connect', () => {
    return {
        __esModule: true, // this property makes it work
        default: {
            uiResponse: () => {},
        },
        UI: {
            RECEIVE_PIN: 'ui-receive_pin',
            RECEIVE_PASSPHRASE: 'ui-receive_passphrase',
            RECEIVE_CONFIRMATION: 'ui-receive_confirmation',
        },
    };
});

const { getSuiteDevice } = global.JestMocks;

const SUITE_DEVICE = getSuiteDevice({ path: '1' });

describe('Modal Actions', () => {
    it('cancel actions', () => {
        const expectedAction = {
            type: MODAL.CLOSE,
        };
        expect(modalActions.onCancel()).toEqual(expectedAction);
    });

    it('onPinSubmit', () => {
        const expectedAction = {
            type: MODAL.CLOSE,
        };
        expect(modalActions.onPinSubmit('1234')).toEqual(expectedAction);
    });

    // it('onReceiveConfirmation', () => {
    //     const expectedAction = {
    //         type: MODAL.CLOSE,
    //     };
    //     expect(modalActions.onReceiveConfirmation(true)).toEqual(expectedAction);
    // });

    it('onRememberDevice', () => {
        const expectedAction = {
            type: SUITE.REMEMBER_DEVICE,
            payload: SUITE_DEVICE,
        };
        expect(modalActions.onRememberDevice(SUITE_DEVICE)).toEqual(expectedAction);
    });

    it('onForgetDevice', () => {
        const expectedAction = {
            type: SUITE.FORGET_DEVICE,
            payload: SUITE_DEVICE,
        };
        expect(modalActions.onForgetDevice(SUITE_DEVICE)).toEqual(expectedAction);
    });

    it('onForgetDeviceInstance', () => {
        const expectedAction = {
            type: SUITE.FORGET_DEVICE_INSTANCE,
            payload: SUITE_DEVICE,
        };
        expect(modalActions.onForgetDeviceInstance(SUITE_DEVICE)).toEqual(expectedAction);
    });
});
