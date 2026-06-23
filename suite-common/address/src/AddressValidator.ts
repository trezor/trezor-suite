import type {
    AddressType,
    AddressValidator as NetworkAddressValidator,
} from '@network-module/suite-types';

import type { NetworksServiceDep } from '@suite-common/networks';

export type AddressValidatorDeps = NetworksServiceDep;

export type AddressValidator = NetworkAddressValidator & {
    getSupportedCoins: () => string[];
    isSupportedCoin: (symbol: string) => symbol is string;
};

export type AddressValidatorDep = {
    addressValidator: AddressValidator;
};

export const selectAddressValidatorDep = (services: any): AddressValidatorDep => ({
    addressValidator: services.addressValidator,
});

export const createAddressValidator = ({ networks }: AddressValidatorDeps): AddressValidator => {
    const validatorByNetworkSymbol = new Map<string, NetworkAddressValidator>();

    networks.networkModules.forEach(networkModule => {
        networkModule.getSupportedCoins().forEach(networkSymbol => {
            if (!networkModule.isSupportedCoin(networkSymbol)) {
                return;
            }
            validatorByNetworkSymbol.set(networkSymbol, networkModule.addressValidator);
        });
    });

    const supportedCoins = Array.from(validatorByNetworkSymbol.keys());

    const getAddressType = (address: string, networkSymbol: string): AddressType | undefined =>
        validatorByNetworkSymbol.get(networkSymbol)?.getAddressType(address, networkSymbol);

    const isAddressValid = (address: string, networkSymbol: string): boolean =>
        validatorByNetworkSymbol.get(networkSymbol)?.isAddressValid(address, networkSymbol) ??
        false;

    const getSupportedCoins = (): string[] => supportedCoins;

    const isSupportedCoin = (symbol: string): symbol is string =>
        validatorByNetworkSymbol.has(symbol);

    return {
        isAddressValid,
        getAddressType,
        getSupportedCoins,
        isSupportedCoin,
    };
};
