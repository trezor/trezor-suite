import type { AddressType, AddressValidator } from '@network-module/suite-types';

import type { NetworksServiceDep } from '@suite-common/networks';

export type AddressValidatorDeps = NetworksServiceDep;

export type { AddressValidator };

export type AddressValidatorDep = {
    addressValidator: AddressValidator;
};

export const selectAddressValidatorDep = (services: any): AddressValidatorDep => ({
    addressValidator: services.addressValidator,
});

export const createAddressValidator = ({ networks }: AddressValidatorDeps): AddressValidator => {
    const validatorByNetworkSymbol = new Map<string, AddressValidator>();

    networks.networkModules.forEach(({ addressValidator }) => {
        addressValidator.getSupportedCoins().forEach(networkSymbol => {
            validatorByNetworkSymbol.set(networkSymbol, addressValidator);
        });
    });

    const getAddressType = (address: string, networkSymbol: string): AddressType | undefined =>
        validatorByNetworkSymbol.get(networkSymbol)?.getAddressType(address, networkSymbol);

    const isAddressValid = (address: string, networkSymbol: string): boolean =>
        validatorByNetworkSymbol.get(networkSymbol)?.isAddressValid(address, networkSymbol) ??
        false;

    const getSupportedCoins = (): string[] => Array.from(validatorByNetworkSymbol.keys());

    return {
        isAddressValid,
        getAddressType,
        getSupportedCoins,
    };
};
