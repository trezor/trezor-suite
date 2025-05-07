import { invariant } from '../invariant';

describe('invariant', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        jest.clearAllMocks();
    });

    it('should throw error when condition is not met', () => {
        expect(() => invariant(false)).toThrow('Invariant Violation');
    });

    it('should allow to set custom message', () => {
        expect(() => invariant(false, 'CUSTOM MESSAGE')).toThrow('CUSTOM MESSAGE');
    });

    it('should not throw error when condition is met', () => {
        expect(() => invariant(true)).not.toThrow();
    });

    it('should log error', () => {
        expect(() => invariant(false, 'CUSTOM MESSAGE')).toThrow();

        expect(consoleErrorSpy).toHaveBeenCalledWith('Invariant violation:', 'CUSTOM MESSAGE');
    });
});
