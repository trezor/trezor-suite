type MessageDescriptor<K extends string> = {
    // Must correspond to the property name.
    id: K;
    // Default text in English. This value is only used directly if the corresponding key is missing from the JSON translation files.
    defaultMessage: string;
    // Not integrated into Crowdin so not really used.
    description?: string;
    // Must be set to true for programmatically constructed keys. Otherwise, the keys will be deleted by the list-duplicates script.
    dynamic?: boolean;
};

/**
Checks whether id corresponds to the property name. Otherwise, text is not translated. Returns the same value that was passed in.
 */
export const defineMessagesWithTypeCheck = <Key extends string>(messages: {
    [K in Key]: MessageDescriptor<K>;
}) => messages;
