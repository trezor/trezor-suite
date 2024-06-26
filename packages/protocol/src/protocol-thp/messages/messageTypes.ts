import type { ThpCredentialResponse } from './protobufTypes';

export type ThpCredentials = ThpCredentialResponse & { autoconnect?: boolean };
