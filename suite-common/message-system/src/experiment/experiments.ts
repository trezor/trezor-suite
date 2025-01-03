export const experiments = {
    // e.g. orangeSendButton: 'fb0eb1bc-8ec3-44d4-98eb-53301d73d981',
    testButton: 'e2e8d05f-1469-4e47-9ab0-53544e5cad07',
} as const;

export type ExperimentNameType = keyof typeof experiments;
export type ExperimentIdType = (typeof experiments)[ExperimentNameType];
