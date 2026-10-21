import { canHandleCtaAction } from './canHandleCtaAction';

describe('canHandleCtaAction', () => {
    it('returns true for an external link', () => {
        expect(canHandleCtaAction('external-link')).toBe(true);
    });

    it('returns false for an internal link', () => {
        expect(canHandleCtaAction('internal-link')).toBe(false);
    });

    it('returns false for a missing action', () => {
        expect(canHandleCtaAction(undefined)).toBe(false);
    });
});
