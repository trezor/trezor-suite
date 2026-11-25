import { isFromContentScript, isFromOpener } from './messageSource';

describe('messageSource', () => {
    const opener = {} as Window;
    const popup = { location: { origin: 'https://connect.trezor.io' }, opener } as Window;
    const event = (source: unknown, origin: string) => ({ source, origin }) as MessageEvent;

    it('isFromContentScript', () => {
        expect(isFromContentScript(event(popup, 'https://connect.trezor.io'), popup)).toBe(true);
        expect(isFromContentScript(event(opener, 'https://example.com'), popup)).toBe(false);
        expect(isFromContentScript(event(opener, 'https://connect.trezor.io'), popup)).toBe(false);
        expect(isFromContentScript(event(popup, 'https://example.com'), popup)).toBe(false);
    });

    it('isFromOpener', () => {
        expect(isFromOpener(event(opener, 'https://example.com'), popup)).toBe(true);
        expect(isFromOpener(event(popup, 'https://connect.trezor.io'), popup)).toBe(false);
        expect(isFromOpener(event({}, 'https://example.com'), popup)).toBe(false);
        expect(isFromOpener(event(null, 'https://example.com'), { ...popup, opener: null })).toBe(
            false,
        );
    });
});
