import { type GraphPoint } from '@suite-native/react-native-graph';

import { getGraphExtremes } from './getGraphExtremes';

describe('getGraphExtremes', () => {
    it('returns nothing when the points span no time', () => {
        expect(getGraphExtremes([])).toBeUndefined();
        expect(getGraphExtremes([{ value: 1, date: new Date(0) }])).toBeUndefined();
    });

    it('places the high and the low by time', () => {
        const points: GraphPoint[] = [
            { value: 2, date: new Date(0) },
            { value: 6, date: new Date(1) },
            { value: 0, date: new Date(4) },
        ];

        expect(getGraphExtremes(points)).toEqual({
            high: { value: 6, relativeX: 0.25 },
            low: { value: 0, relativeX: 1 },
        });
    });
});
