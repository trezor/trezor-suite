import { typedObjectValues } from '../src/typedObject';

type AB = { a: 'A'; b: 'B' } | { b: 'BB' };

type ExpectedType = 'BB' | 'B' | 'A';

let _assertExpectedType: ExpectedType[];

const test1 = typedObjectValues({ b: 'BB' } satisfies AB);
_assertExpectedType = test1;
const test2 = typedObjectValues({ a: 'A', b: 'B' } satisfies AB);
_assertExpectedType = test2;

void _assertExpectedType;
