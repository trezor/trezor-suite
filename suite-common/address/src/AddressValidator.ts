import type { CoinSymbol, NetworkModuleRepositoryDep } from '@suite-common/networks';
import type { AddressValidator as NetworkAddressValidator } from '@trezor/network-module-suite-types';

export type AddressValidator = NetworkAddressValidator<CoinSymbol>;

export type AddressValidatorDeps = NetworkModuleRepositoryDep;

export type AddressValidatorDep = {
    addressValidator: AddressValidator;
};

export const selectAddressValidatorDep = (services: any): AddressValidatorDep => ({
    addressValidator: services.addressValidator,
});

export const createAddressValidator = (deps: AddressValidatorDeps): AddressValidator => ({
    isAddressValid: (address: string, symbol: CoinSymbol) =>
        deps.networkModuleRepository.get(symbol).addressValidator.isAddressValid(address, symbol),

    getAddressType: (address: string, symbol: CoinSymbol) =>
        deps.networkModuleRepository.get(symbol).addressValidator.getAddressType(address, symbol),
});
