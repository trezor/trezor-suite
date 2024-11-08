export const experiments = {
    // e.g. orangeSendButton: 'fb0eb1bc-8ec3-44d4-98eb-53301d73d981',
} as const;

export type ExperimentNameType = keyof typeof experiments;
export type ExperimentIdType = (typeof experiments)[ExperimentNameType];
