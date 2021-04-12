import * as modalActions from '../modalActions';
import { MODAL } from '../constants';

jest.mock('trezor-connect', () => ({
    __esModule: true, // this property makes it work
    default: {
        blockchainSetCustomBackend: () => {},
        uiResponse: () => {},
    },
    UI: {
        RECEIVE_PIN: 'ui-receive_pin',
        RECEIVE_PASSPHRASE: 'ui-receive_passphrase',
        RECEIVE_CONFIRMATION: 'ui-receive_confirmation',
    },
}));

describe('Modal Actions', () => {
    it('cancel actions', () => {
        const expectedAction = {
            type: MODAL.CLOSE,
        };
        expect(modalActions.onCancel()).toEqual(expectedAction);
    });

    // it('onPinSubmit', () => {
    //     const expectedAction = {
    //         type: MODAL.CLOSE,
    //     };
    //     expect(modalActions.onPinSubmit('1234')).toEqual(expectedAction);
    // });

    // it('onReceiveConfirmation', () => {
    //     const expectedAction = {
    //         type: MODAL.CLOSE,
    //     };
    //     expect(modalActions.onReceiveConfirmation(true)).toEqual(expectedAction);
    // });
});
