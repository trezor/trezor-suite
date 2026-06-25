import type {
    AddressType,
    AddressValidator as NetworkAddressValidator,
} from '@network-module/suite-types';

import type { CoinSymbol, NetworksServiceDep } from '@suite-common/networks';
import { typedObjectValues } from '@trezor/utils';

export type AddressValidatorDeps = NetworksServiceDep;

export type AddressValidator = NetworkAddressValidator & {
    getSupportedCoins: () => readonly CoinSymbol[];
    isSupportedCoin: (symbol: string) => symbol is CoinSymbol;
};

export type AddressValidatorDep = {
    addressValidator: AddressValidator;
};

export const selectAddressValidatorDep = (services: any): AddressValidatorDep => ({
    addressValidator: services.addressValidator,
});

export const createAddressValidator = ({ networks }: AddressValidatorDeps): AddressValidator => {
    const validatorByNetworkSymbol = new Map<CoinSymbol, NetworkAddressValidator>();

    typedObjectValues(networks.networkModules).forEach(networkModule => {
        networkModule.getSupportedCoins().forEach(networkSymbol => {
            if (!networkModule.isSupportedCoin(networkSymbol)) {
                return;
            }
            validatorByNetworkSymbol.set(networkSymbol, networkModule.addressValidator);
        });
    });

    const supportedCoins = Array.from(validatorByNetworkSymbol.keys());

    const isSupportedCoin = (symbol: string): symbol is CoinSymbol =>
        validatorByNetworkSymbol.has(symbol as CoinSymbol);

    const getAddressType = (address: string, networkSymbol: string): AddressType | undefined => {
        if (!isSupportedCoin(networkSymbol)) {
            return undefined;
        }

        return validatorByNetworkSymbol.get(networkSymbol)?.getAddressType(address, networkSymbol);
    };

    const isAddressValid = (address: string, networkSymbol: string): boolean => {
        if (!isSupportedCoin(networkSymbol)) {
            return false;
        }

        return (
            validatorByNetworkSymbol.get(networkSymbol)?.isAddressValid(address, networkSymbol) ??
            false
        );
    };

    const getSupportedCoins = (): readonly CoinSymbol[] => supportedCoins;

    return {
        isAddressValid,
        getAddressType,
        getSupportedCoins,
        isSupportedCoin,
    };
};
