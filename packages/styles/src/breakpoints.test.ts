import { breakpointMediaQueries, breakpointThresholds } from './breakpoints';

describe('breakpointMediaQueries', () => {
    it('contains correct values', () => {
        Object.entries(breakpointMediaQueries).forEach(([breakpointName, mediaQuery]) => {
            if (!breakpointName.startsWith('below_')) {
                expect(mediaQuery).toContain(breakpointThresholds[breakpointName].toString());
            }
        });
    });
});
