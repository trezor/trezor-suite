import messages from './messages';

/**
 * This file is here just to be picked up by type-check to check that keys and ids match in `messages.ts`
 */

type Messages = typeof messages;
type TranslationKey = keyof Messages;
type TranslationId = Messages[keyof Messages]['id'];

// check if one type is assignable to the other, and then do the same in reverse (i.e. if types exactly match)
const functionJustForTypeCheck1 = (k: TranslationId): TranslationKey => k;
const functionJustForTypeCheck2 = (k: TranslationKey): TranslationId => k;

// @ts-expect-error TS6133: Suppress unused variable error;
// can't do this over the function so that it does not suppress the type check itself
const _suppressUnusedVariableError = functionJustForTypeCheck1 || functionJustForTypeCheck2;
