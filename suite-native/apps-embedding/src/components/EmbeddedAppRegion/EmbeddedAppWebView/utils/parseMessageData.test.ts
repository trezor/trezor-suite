import { parseMessageData } from './parseMessageData';

describe('parseMessageData', () => {
    it('should log a JSON message by its parsed value', () => {
        expect(parseMessageData('{"type":"ready","count":2}')).toEqual({ type: 'ready', count: 2 });
    });

    it('should keep JSON primitives, null included', () => {
        expect(parseMessageData('null')).toBeNull();
        expect(parseMessageData('42')).toBe(42);
    });

    it('should log anything else as the string it sent', () => {
        expect(parseMessageData('hello')).toBe('hello');
        expect(parseMessageData('')).toBe('');
    });
});
