import type { AddressValidator as NetworkAddressValidator } from '@trezor/network-module-suite-common-types';

import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';
import type { NetworkSymbol } from './NetworkModules';

export type AddressValidator = NetworkAddressValidator<NetworkSymbol>;

export type AddressValidatorDeps = NetworkModuleRepositoryDep;

export type AddressValidatorDep = {
    addressValidator: AddressValidator;
};

export const injectAddressValidator = (services: any): AddressValidatorDep => ({
    addressValidator: services.networks.addressValidator,
});

export const createAddressValidator = (deps: AddressValidatorDeps): AddressValidator => ({
    isAddressValid: (symbol: NetworkSymbol, address: string) =>
        deps.networkModuleRepository.get(symbol).addressValidator.isAddressValid(symbol, address),

    getAddressType: (symbol: NetworkSymbol, address: string) =>
        deps.networkModuleRepository.get(symbol).addressValidator.getAddressType(symbol, address),
});
