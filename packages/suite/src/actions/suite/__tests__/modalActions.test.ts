import { MODAL_CLOSE, closeModal } from '@suite/modal';

describe('Modal Actions', () => {
    it('cancel actions', () => {
        const expectedAction = {
            type: MODAL_CLOSE,
        };
        expect(closeModal()).toEqual(expectedAction);
    });
});
