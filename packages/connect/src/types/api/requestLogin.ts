/**
 * Challenge-response authentication via Trezor.
 * To protect against replay attacks you should use a server-side generated
 * and randomized challengeHidden for every attempt. You can also provide a
 * visual challenge that will be shown on the device.
 */

import type { Params, Response } from '../params';

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

export declare function requestLogin(
    params: Params<RequestLoginAsync | LoginChallenge>,
): Response<Login>;
