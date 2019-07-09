import modalActions from '../modalActions';
import { MODAL } from '../constants';

describe('Modal Actions', () => {
    it('cancel actions', () => {
        const expectedAction = {
            type: MODAL.CLOSE,
        };
        expect(modalActions.cancel()).toEqual(expectedAction);
    });
});
