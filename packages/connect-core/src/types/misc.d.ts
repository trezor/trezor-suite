import type { Proxy } from './params';

export interface CipherKeyValue {
    path: string | number[];
    key: string;
    value: string | Buffer;
    encrypt?: boolean;
    askOnEncrypt?: boolean;
    askOnDecrypt?: boolean;
    iv?: string;
}

export interface CipheredValue {
    value: string;
}

export interface LoginChallenge {
    challengeHidden: string;
    challengeVisual: string;
}

export interface RequestLoginAsync {
    callback: () => LoginChallenge;
    asyncChallenge?: boolean;
}

export interface Login {
    address: string;
    publicKey: string;
    signature: string;
}

export interface CustomMessage {
    messages?: JSON | object;
    message: string;
    params: JSON | object;
    callback: (request: any) => Promise<{ message: string; params?: object }>;
}

export type SetProxy = {
    proxy?: Proxy;
    useOnionLinks?: boolean;
};
