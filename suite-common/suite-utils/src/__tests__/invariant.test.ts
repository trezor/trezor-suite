import { invariant } from '../invariant';

describe('invariant', () => {
    it('should throw error when condition is not met', () => {
        expect(() => invariant(false)).toThrow('Invariant Violation');
    });

    it('should allow to set custom message', () => {
        expect(() => invariant(false, 'CUSTOM MESSAGE')).toThrow('CUSTOM MESSAGE');
    });

    it('should not throw error when condition is met', () => {
        expect(() => invariant(true)).not.toThrow();
    });
});
