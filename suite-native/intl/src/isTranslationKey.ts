import { messages } from './messages';
import { type TxKeyPath } from './types';
import { flatten } from './utils';

const translationKeys = new Set(Object.keys(flatten(messages)));

export const isTranslationKey = (value: unknown): value is TxKeyPath =>
    typeof value === 'string' && translationKeys.has(value);
