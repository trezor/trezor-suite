import { type ThpCredentials } from '@trezor/protocol';

export type ThpSuiteCredentials = ThpCredentials & {
    connectionCounter: number;
};

export type ThpHostNameDep = {
    thpHostName?: string;
};
