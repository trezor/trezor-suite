import { messages as definedMessages } from '@suite/intl';

export const getEffectiveIntlMessages = (
    localizedMessages: Record<string, string>,
    showTranslationKeys: boolean,
): Record<string, string> => {
    if (!showTranslationKeys) {
        return localizedMessages;
    }

    // Ctrl+F12 remaps catalog values to their ids. Downloaded JSON files lag behind
    // messages.ts until the next Crowdin sync, so union both sources or new keys
    // would keep showing defaultMessage instead of the id.
    const ids = new Set([...Object.keys(localizedMessages), ...Object.keys(definedMessages)]);

    return Object.fromEntries([...ids].map(id => [id, id]));
};
