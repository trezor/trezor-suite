import { typedObjectKeys } from './typedObject';

type AB = { a: 'A'; b: 'B' } | { b: 'BB' };

type ExpectedType = 'a' | 'b';

let _assertExpectedType: ExpectedType[];

const test1 = typedObjectKeys({ b: 'BB' } satisfies AB);
_assertExpectedType = test1;
const test2 = typedObjectKeys({ a: 'A', b: 'B' } satisfies AB);
_assertExpectedType = test2;

void _assertExpectedType;
