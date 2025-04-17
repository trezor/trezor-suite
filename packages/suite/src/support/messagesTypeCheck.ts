import messages from './messages';

/**
 * This file is here just to be picked up by type-check to check that keys and ids match in `messages.ts`
 */

type Messages = typeof messages;
type TranslationKey = keyof Messages;
type TranslationId = Messages[keyof Messages]['id'];

const functionJustForTypeCheck = (k: TranslationId): TranslationKey => k;

// @ts-expect-error TS6133: Suppress unused variable error;
// can't do this over the function so that it does not suppress the type check itself
const _suppressUnusedVariableError = functionJustForTypeCheck;
