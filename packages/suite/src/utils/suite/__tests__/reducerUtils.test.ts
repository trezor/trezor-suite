import * as fixtures from '../__fixtures__/reducerUtils';
import * as reducerUtils from '../reducerUtils';

describe('reducer utils', () => {
    fixtures.observeChanges.forEach(f => {
        it(`observeChanges${f.testName}`, () => {
            // @ts-ignore
            expect(reducerUtils.observeChanges(f.prev, f.current, f.filter)).toEqual(f.result);
        });
    });
});
