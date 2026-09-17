import { mapIntentToCSS } from './mapIntentToCSS';
import { addAlphaToHex } from './utils';
import { intermediaryTheme } from '../config/colors';

const theme = { ...intermediaryTheme.light, variant: 'light' } as const;

describe('mapIntentToCSS', () => {
    it('returns the intent color for primary priority', () => {
        expect(mapIntentToCSS('warning', 'primary', false, theme)).toBe(theme.contentWarning);
    });

    it('returns the on-dark intent color when inverse', () => {
        expect(mapIntentToCSS('warning', 'primary', true, theme)).toBe(
            theme.contentOnDarkWarning,
        );
    });

    it('applies alpha for secondary priority', () => {
        expect(mapIntentToCSS('brand', 'secondary', false, theme)).toBe(
            addAlphaToHex(theme.contentBrand, 0.74),
        );
    });
});
