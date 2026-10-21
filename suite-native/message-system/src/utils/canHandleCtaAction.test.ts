import { type CTA } from '@suite-common/suite-types';

import { canHandleCtaAction } from './canHandleCtaAction';

const createLabel = (text: string) => ({
    en: text,
    es: text,
    cs: text,
    de: text,
    fr: text,
    pt: text,
});

const createCta = (cta: Partial<CTA> = {}): CTA => ({
    action: 'external-link',
    link: 'https://trezor.io',
    label: createLabel('Open'),
    ...cta,
});

describe('canHandleCtaAction', () => {
    it('returns true for an external link with a link and a label', () => {
        expect(canHandleCtaAction(createCta(), 'en')).toBe(true);
    });

    it('returns false for an internal link', () => {
        expect(canHandleCtaAction(createCta({ action: 'internal-link' }), 'en')).toBe(false);
    });

    it('returns false for an empty link', () => {
        expect(canHandleCtaAction(createCta({ link: '' }), 'en')).toBe(false);
    });

    it('returns false for an empty label', () => {
        expect(canHandleCtaAction(createCta({ label: createLabel('') }), 'en')).toBe(false);
    });

    it('returns false for a missing CTA', () => {
        expect(canHandleCtaAction(undefined, 'en')).toBe(false);
    });
});
