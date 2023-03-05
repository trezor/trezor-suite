import { prioritizeEndpoints } from '../../src/workers/utils';

import * as fixtures from './fixtures/utils';

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
