import * as fixtures from './fixtures/utils';
import { prioritizeEndpoints } from '../../src/workers/utils';

describe('prioritizeEndpoints', () => {
    it('prioritizeEndpoints', () => {
        const { unsorted, sorted } = fixtures.endpoints;
        const res = prioritizeEndpoints(unsorted);
        const resFixed = [
            ...res.slice(0, 3).sort(),
            ...res.slice(3, 6).sort(),
            ...res.slice(6, 9).sort(),
        ];
        expect(resFixed).toStrictEqual(sorted);
    });
});
