type GetEffectiveIntlMessagesParams = {
    localizedMessages: Record<string, string>;
    definedMessageIds: readonly string[];
    showTranslationKeys: boolean;
};

export const getEffectiveIntlMessages = ({
    localizedMessages,
    definedMessageIds,
    showTranslationKeys,
}: GetEffectiveIntlMessagesParams): Record<string, string> => {
    if (!showTranslationKeys) {
        return localizedMessages;
    }

    // Ctrl+F12 remaps catalog values to their ids. The file `messages.ts` is the source of truth
    // for keys used within codebase, while downloaded JSON files lag behind until the next Crowdin sync,
    // so use `messages.ts` keys, otherwise it would keep showing defaultMessage instead of the id.
    return Object.fromEntries(definedMessageIds.map(id => [id, id]));
};
