export type MessageDescriptor = {
    // A unique, stable identifier for the message
    id: string, 
    
    // The default message (probably in English)
    defaultMessage: string,
    
    // Context for the translator about how it's used in the UI
    description?: string | object, 
};

export type Messages = {
    [key: string]: MessageDescriptor
};