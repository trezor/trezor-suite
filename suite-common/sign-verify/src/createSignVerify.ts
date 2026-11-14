import { type SignMessage, type SignMessageDeps, createSignMessage } from './createSignMessage';
import {
    type VerifyMessage,
    type VerifyMessageDeps,
    createVerifyMessage,
} from './createVerifyMessage';

export type SignVerifyDeps = SignMessageDeps & VerifyMessageDeps;

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
