import { getDashboardParamModal } from './useGlobalSendReceiveModal';

describe('getDashboardParamModal', () => {
    it('returns the modal type for valid params', () => {
        expect(getDashboardParamModal({ modal: 'send' })).toBe('send');
        expect(getDashboardParamModal({ modal: 'receive' })).toBe('receive');
    });

    it('returns null for malformed params without logging', () => {
        const consoleErrorSpy = jest.spyOn(console, 'error');

        expect(getDashboardParamModal(undefined)).toBeNull();
        expect(getDashboardParamModal(null)).toBeNull();
        expect(getDashboardParamModal(true)).toBeNull();
        expect(getDashboardParamModal('send')).toBeNull();
        expect(getDashboardParamModal(['send'])).toBeNull();
        expect(getDashboardParamModal({ cancelable: true })).toBeNull();

        expect(consoleErrorSpy).not.toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
    });

    it('returns null for invalid modal values', () => {
        expect(getDashboardParamModal({ modal: 'unknown' })).toBeNull();
        expect(getDashboardParamModal({ modal: true })).toBeNull();
    });
});
