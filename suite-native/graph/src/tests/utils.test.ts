import { EnhancedGraphPoint, getExtremaFromGraphPoints } from '../utils';

describe('Suite native graph utils', () => {
    test('getExtremaFromGraphPoints', () => {
        const graphPoints: EnhancedGraphPoint[] = [
            {
                value: 0,
                date: new Date(0),
                originalDate: new Date(),
            },
            {
                value: 2,
                date: new Date(1),
                originalDate: new Date(),
            },
            {
                value: 6,
                date: new Date(2),
                originalDate: new Date(),
            },
            {
                value: 0,
                date: new Date(3),
                originalDate: new Date(),
            },
            {
                value: 2,
                date: new Date(4),
                originalDate: new Date(),
            },
            {
                value: 1,
                date: new Date(5),
                originalDate: new Date(),
            },
        ];

        const extremaFromPoints = getExtremaFromGraphPoints(graphPoints)!;

        expect(extremaFromPoints.max.value).toEqual(6);
        expect(Math.floor(extremaFromPoints.max.x)).toEqual(42);

        expect(extremaFromPoints.min.value).toEqual(0);
        expect(Math.floor(extremaFromPoints.min.x)).toEqual(14);
    });
});
