import { typedObjectKeys } from '../src/typedObjectKeys';

type AB = { a: number; b: number } | { b: string };
const ab: AB = { b: 'B' };

export const _test: 'b'[] = typedObjectKeys(ab);
