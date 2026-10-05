import { isEnterSubmit } from './keyboard';

const event = (key: string, isComposing: boolean) => ({ key, nativeEvent: { isComposing } });

describe('contacts keyboard', () => {
    describe('isEnterSubmit', () => {
        it('submits on a plain Enter press', () => {
            expect(isEnterSubmit(event('Enter', false))).toBe(true);
        });

        it('does not submit while an IME composition is in flight', () => {
            // Enter confirms the composed candidate and must not submit the half-composed text.
            expect(isEnterSubmit(event('Enter', true))).toBe(false);
        });

        it('does not submit on any other key', () => {
            expect(isEnterSubmit(event('a', false))).toBe(false);
            expect(isEnterSubmit(event('Escape', false))).toBe(false);
            expect(isEnterSubmit(event('Tab', false))).toBe(false);
        });
    });
});
