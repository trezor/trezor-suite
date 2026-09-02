import { normalizeCancelParams } from './cancelParams';

describe('utils/cancelParams', () => {
    describe('normalizeCancelParams', () => {
        it('returns empty object when params is undefined', () => {
            expect(normalizeCancelParams()).toEqual({});
            expect(normalizeCancelParams(undefined)).toEqual({});
        });

        it('returns the object as-is when params is an object', () => {
            expect(normalizeCancelParams({})).toEqual({});
            expect(normalizeCancelParams({ reason: 'foo' })).toEqual({ reason: 'foo' });
            expect(normalizeCancelParams({ callId: 'abc' })).toEqual({ callId: 'abc' });
            expect(normalizeCancelParams({ reason: 'foo', callId: 'abc' })).toEqual({
                reason: 'foo',
                callId: 'abc',
            });
        });

        it('wraps a string into { reason } for backward compatibility', () => {
            expect(normalizeCancelParams('cancelled')).toEqual({ reason: 'cancelled' });
            expect(normalizeCancelParams('')).toEqual({ reason: '' });
        });
    });
});
