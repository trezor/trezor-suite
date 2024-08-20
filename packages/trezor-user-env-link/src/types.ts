/** device model as expected by trezor-user-env */
export type Model = 'T1B1' | 'T2T1' | 'T2B1' | 'T3T1';

export type Firmwares = Record<Model, string[]>;
