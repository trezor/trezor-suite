import { type NetworkModuleRepositoryDep } from '@suite-common/networks';

import { type SignMessage, createSignMessage } from './createSignMessage';
import { type SignVerifyReporterDeps, createSignVerifyReporter } from './createSignVerifyReporter';
import { type VerifyMessage, createVerifyMessage } from './createVerifyMessage';

export type SignVerifyDeps = NetworkModuleRepositoryDep & SignVerifyReporterDeps;

export type SignVerify = SignMessage & VerifyMessage;

export type SignVerifyDep = {
    signVerify: SignVerify;
};

export const injectSignVerify = (services: any): SignVerifyDep => ({
    signVerify: services.signVerify,
});

export const createSignVerify = (deps: SignVerifyDeps): SignVerify => {
    const serviceDeps = {
        networkModuleRepository: deps.networkModuleRepository,
        signVerifyReporter: createSignVerifyReporter(deps),
    };

    return {
        ...createSignMessage(serviceDeps),
        ...createVerifyMessage(serviceDeps),
    };
};
