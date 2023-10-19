import { FiatGraphPoint } from '@suite-common/graph';

import { getExtremaFromGraphPoints } from '../utils';

describe('Suite native graph utils', () => {
    test('getExtremaFromGraphPoints', () => {
        const graphPoints: FiatGraphPoint[] = [
            {
                value: 0,
                date: new Date(0),
            },
            {
                value: 2,
                date: new Date(1),
            },
            {
                value: 6,
                date: new Date(2),
            },
            {
                value: 0,
                date: new Date(3),
            },
            {
                value: 2,
                date: new Date(4),
            },
            {
                value: 1,
                date: new Date(5),
            },
        ];

        const extremaFromPoints = getExtremaFromGraphPoints(graphPoints)!;

        expect(extremaFromPoints.max.value).toEqual(6);
        expect(Math.floor(extremaFromPoints.max.x)).toEqual(42);

        expect(extremaFromPoints.min.value).toEqual(0);
        expect(Math.floor(extremaFromPoints.min.x)).toEqual(14);
    });
});
