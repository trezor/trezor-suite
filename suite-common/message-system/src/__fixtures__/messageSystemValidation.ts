export const stripFieldFromMessage = [
    {
        description: "does not strip when message doesn't start with field (JSON parse error)",
        input: [
            {
                field: 'JSON',
                message:
                    "Expected ',' or '}' after property value in JSON at position 85 (line 4 column 19)",
            },
        ],
        result: [
            {
                field: 'JSON',
                message:
                    "Expected ',' or '}' after property value in JSON at position 85 (line 4 column 19)",
            },
        ],
    },
    {
        description: 'strips field prefix for message.priority',
        input: [
            {
                field: 'message.priority',
                message: 'message.priority Priority cannot exceed 100',
            },
        ],
        result: [
            {
                field: 'message.priority',
                message: 'Priority cannot exceed 100',
            },
        ],
    },
    {
        description: 'strips field prefix for array path message.feature[0].domain',
        input: [
            {
                field: 'message.feature[0].domain',
                message: 'message.feature[0].domain Select a valid feature from the list.',
            },
        ],
        result: [
            {
                field: 'message.feature[0].domain',
                message: 'Select a valid feature from the list.',
            },
        ],
    },
];
