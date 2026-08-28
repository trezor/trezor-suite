import { typedObjectKeys } from './typedObject';

type AB = { a: 'A'; b: 'B' } | { b: 'BB' };

type ExpectedType = 'a' | 'b';

const assertExpectedType1: ExpectedType[] = typedObjectKeys({ b: 'BB' } satisfies AB);
const assertExpectedType2: ExpectedType[] = typedObjectKeys({ a: 'A', b: 'B' } satisfies AB);

void assertExpectedType1;
void assertExpectedType2;
