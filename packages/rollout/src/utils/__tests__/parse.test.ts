import { parseFeatures, parseReleases } from '../parse';

describe('parse', () => {
    describe('parseFeatures()', () => {
        it('fail on not matching pattern', () => {
            expect(() => {
                // @ts-ignore
                parseFeatures({ foo: 'bar' });
            }).toThrow('Features of unexpected shape provided to rollout');
        });
    });

    describe('parseReleases()', () => {
        it('fail on not matching pattern', () => {
            expect(() => {
                // @ts-ignore
                parseReleases({ foo: 'bar' });
            }).toThrow();
        });
    });
});
