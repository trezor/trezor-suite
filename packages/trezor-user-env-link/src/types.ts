/** device model as expected by trezor-user-env */
export enum Model {
    T1B1 = 'T1B1',
    T2T1 = 'T2T1',
    T3B1 = 'T3B1',
    T3T1 = 'T3T1',
    T3W1 = 'T3W1',
}

export type Firmwares = Record<Model, string[]>;
