import { createContext, useContext } from 'react';

import type { PassphraseFlowManager } from 'src/actions/wallet/passphraseFlowManager';

export type ServiceFactory<T> = (deps: any) => T;

export type Services = {
    passphraseFlowManager: PassphraseFlowManager;
};
export const ServiceContext = createContext<Services | null>(null);

export const useServices = () => {
    const services = useContext(ServiceContext);
    if (!services) {
        throw new Error('Services not found - is ServiceContext.Provider in the render tree?');
    }

    return services;
};
