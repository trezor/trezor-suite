import * as fixtures from '../__fixtures__/comparisonUtils';
import * as comparisonUtils from '../comparisonUtils';

describe('reducer utils', () => {
    fixtures.isChanged.forEach(f => {
        it(`isChanged${f.testName}`, () => {
            expect(comparisonUtils.isChanged(f.prev, f.current, f.filter)).toEqual(f.result);
        });
    });
});
