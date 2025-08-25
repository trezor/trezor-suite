/** device model as expected by trezor-user-env */
export const MODELS = ['T1B1', 'T2T1', 'T3B1', 'T3T1', 'T3W1'] as const;
export type Model = (typeof MODELS)[number];

export type Firmwares = Record<Model, string[]>;
