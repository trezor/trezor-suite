/** device model as expected by trezor-user-env */
export type Model = 'T3T1' | '1' | '2' | 'R';

export type Firmwares = Record<Model, string[]>;
