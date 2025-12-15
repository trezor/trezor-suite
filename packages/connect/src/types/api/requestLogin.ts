/**
 * Challenge-response authentication via Trezor.
 * To protect against replay attacks you should use a server-side generated
 * and randomized challengeHidden for every attempt. You can also provide a
 * visual challenge that will be shown on the device.
 */

import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { Params, Response } from '../params';

export type LoginChallenge = Static<typeof LoginChallenge>;
export const LoginChallenge = Type.Object({
    challengeHidden: Type.String(),
    challengeVisual: Type.String(),
    origin: Type.Optional(Type.String()),
    asyncChallenge: Type.Optional(Type.Undefined()),
    callback: Type.Optional(Type.Undefined()),
});

export type RequestLoginSchema = Static<typeof RequestLoginSchema>;
export const RequestLoginSchema = Type.Union([LoginChallenge]);

export interface Login {
    address: string;
    publicKey: string;
    signature: string;
}

export declare function requestLogin(params: Params<RequestLoginSchema>): Response<Login>;
