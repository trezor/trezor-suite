import { getMessageDataLength } from './getMessageDataLength';

describe('getMessageDataLength', () => {
    it('should measure a string by its length', () => {
        expect(getMessageDataLength('')).toBe(0);
        expect(getMessageDataLength('hello')).toBe(5);
        expect(getMessageDataLength('x'.repeat(70_000))).toBe(70_000);
    });

    it('should measure a value posted through the WebKit handler by its JSON', () => {
        expect(getMessageDataLength({ type: 'ready' })).toBe('{"type":"ready"}'.length);
        expect(getMessageDataLength(['x'.repeat(100)])).toBe(104);
        expect(getMessageDataLength(42)).toBe(2);
        expect(getMessageDataLength(null)).toBe(4);
    });

    it('should count a value JSON cannot serialize as nothing', () => {
        const data: Record<string, unknown> = {};
        data.itself = data;

        expect(getMessageDataLength(data)).toBe(0);
        expect(getMessageDataLength(undefined)).toBe(0);
    });
});
