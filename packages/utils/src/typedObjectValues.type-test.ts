import { typedObjectValues } from './typedObject';

type AB = { a: 'A'; b: 'B' } | { b: 'BB' };

type ExpectedType = 'BB' | 'B' | 'A';

const assertExpectedType1: ExpectedType[] = typedObjectValues({ b: 'BB' } satisfies AB);
const assertExpectedType2: ExpectedType[] = typedObjectValues({ a: 'A', b: 'B' } satisfies AB);

void assertExpectedType1;
void assertExpectedType2;
