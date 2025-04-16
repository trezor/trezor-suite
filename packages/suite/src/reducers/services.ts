import { createContext, useContext } from 'react';

import { ExtraDependencies } from '@suite-common/redux-utils/libDev/src';

import { createPassphraseFlowManager } from '../actions/wallet/createPassphraseFlowManager';
import { Store } from '../types/suite';

export const dependencyInjectionContainer = (
    store: Store,
    extraDependencies: ExtraDependencies,
) => {
    const passphraseFlowManager = createPassphraseFlowManager({
        store,
        discoveryHook: extraDependencies.services.discoveryHook,
        trezorConnectService: extraDependencies.services.trezorConnectService,
    });

    return {
        passphraseFlowManager,
    };
};

type Services = ReturnType<typeof dependencyInjectionContainer>;

export const ServiceContext = createContext<Services | null>(null);

export const useServices = () => {
    const services = useContext(ServiceContext);
    if (!services) {
        throw new Error('Services not found - is ServiceContext.Provider in the render tree?');
    }

    return services;
};
