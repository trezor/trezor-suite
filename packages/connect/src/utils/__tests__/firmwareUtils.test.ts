import { isStrictFeatures } from '../firmwareUtils';

describe('parse', () => {
    describe('isStrictFeatures()', () => {
        it('fail on not matching pattern', () => {
            expect(
                // @ts-expect-error
                isStrictFeatures({ foo: 'bar' }),
            ).toEqual(false);
        });
    });
});
