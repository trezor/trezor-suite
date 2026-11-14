import { type SignMessage, type SignMessageDeps, createSignMessage } from './createSignMessage';
import {
    type VerifyMessage,
    type VerifyMessageDeps,
    createVerifyMessage,
} from './createVerifyMessage';

export type SignVerifyDeps = SignMessageDeps & VerifyMessageDeps;

/**
 * SignVerify for an account: signs a message with its key and verifies signatures against an
 * address, through the SignVerify of the account's network.
 *
 * @see https://github.com/trezor/trezor-suite/blob/develop/docs/ubiquitous-language.md
 */
export type SignVerify = SignMessage & VerifyMessage;

export type SignVerifyDep = {
    signVerify: SignVerify;
};

export const injectSignVerify = (services: any): SignVerifyDep => ({
    signVerify: services.signVerify,
});

export const createSignVerify = (deps: SignVerifyDeps): SignVerify => ({
    ...createSignMessage(deps),
    ...createVerifyMessage(deps),
});
