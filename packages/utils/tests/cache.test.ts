import { Cache } from '../src/cache';

const delay = (ms: number) => jest.advanceTimersByTime(ms);

const TTL = 100;

describe('Cache', () => {
    let cache: Cache;

    beforeEach(() => {
        jest.useFakeTimers();
        cache = new Cache();
    });

    it('set and get', () => {
        cache.set('key', 'value', TTL);
        expect(cache.get('key')).toEqual('value');
    });

    it('get with expired TTL', () => {
        cache.set('key', 'value', TTL);
        delay(TTL + 1);
        expect(cache.get('key')).toBeUndefined();
    });

    it('delete', () => {
        cache.set('key', 'value', TTL);
        cache.delete('key');
        expect(cache.get('key')).toBeUndefined();
    });
});
