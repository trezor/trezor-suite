import type { AddressValidator as NetworkAddressValidator } from '@trezor/network-module-suite-common-types';

import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';
import type { NetworkSymbol } from './NetworkModules';

export type AddressValidator = NetworkAddressValidator<NetworkSymbol>;

export type AddressValidatorDeps = NetworkModuleRepositoryDep;

export type AddressValidatorDep = {
    addressValidator: AddressValidator;
};

export const selectAddressValidatorDep = (services: any): AddressValidatorDep => ({
    addressValidator: services.networks.addressValidator,
});

export const createAddressValidator = (deps: AddressValidatorDeps): AddressValidator => ({
    isAddressValid: (address: string, symbol: NetworkSymbol) =>
        deps.networkModuleRepository.get(symbol).addressValidator.isAddressValid(address, symbol),

    getAddressType: (address: string, symbol: NetworkSymbol) =>
        deps.networkModuleRepository.get(symbol).addressValidator.getAddressType(address, symbol),
});
