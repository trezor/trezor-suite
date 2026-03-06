import { MODAL_CLOSE } from '@suite/modal';
import * as modalActions from '@suite/modal';

describe('Modal Actions', () => {
    it('cancel actions', () => {
        const expectedAction = {
            type: MODAL_CLOSE,
        };
        expect(modalActions.onCancel()).toEqual(expectedAction);
    });
});
