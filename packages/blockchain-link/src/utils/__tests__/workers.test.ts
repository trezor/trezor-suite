import * as workersUtils from '../workers';

describe('worker utils', () => {
    expect(workersUtils.removeEmpty({ a: 1, b: 2, c: 3 }).equals({ a: 1, b: 2, c: 3 }));
    expect(workersUtils.removeEmpty({ a: undefined, b: 2, c: 3 }).equals({ b: 2, c: 3 }));
    expect(workersUtils.removeEmpty({ a: undefined, b: undefined, c: 3 }).equals({ c: 3 }));
    expect(workersUtils.removeEmpty({ a: { b: 1, c: 2 } }).equals({ a: { b: 1, c: 2 } }));
    expect(workersUtils.removeEmpty({ a: { b: undefined, c: 2 } }).equals({ a: { c: 2 } }));
    expect(
        workersUtils
            .removeEmpty({ a: { b: { c: 1, d: undefined } } })
            .equals({ a: { b: { c: 1 } } })
    );
});
