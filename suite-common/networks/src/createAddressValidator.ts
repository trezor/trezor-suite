import type { AddressValidator as NetworkAddressValidator } from '@trezor/network-module-suite-common-types';

import type { NetworkSymbol } from './NetworkModules';
import type { NetworkModuleRepositoryDep } from './createNetworkModuleRepository';

export type AddressValidatorDeps = NetworkModuleRepositoryDep;

export type AddressValidator = NetworkAddressValidator<NetworkSymbol>;

export type AddressValidatorDep = {
    addressValidator: AddressValidator;
};

export const selectAddressValidatorDep = (services: any): AddressValidatorDep => ({
    addressValidator: services.networks.addressValidator,
});

export const createAddressValidator = (deps: AddressValidatorDeps): AddressValidator => ({
    isAddressValid: (address, symbol) =>
        deps.networkModuleRepository.get(symbol).addressValidator.isAddressValid(address, symbol),

    getAddressType: (address, symbol) =>
        deps.networkModuleRepository.get(symbol).addressValidator.getAddressType(address, symbol),
});
