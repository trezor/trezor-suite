import type {
    AddressType,
    AddressValidator,
} from '@network-module/suite-types/src/AddressValidator';

import type { NetworksServiceDep } from '@suite-common/networks';
import type { NetworkSymbol } from '@suite-common/wallet-config';

export type AddressValidatorDeps = NetworksServiceDep;

export type AddressValidatorDep = {
    addressValidator: AddressValidator;
};

export const createAddressValidator = ({ networks }: AddressValidatorDeps): AddressValidator => {
    const validatorByNetworkSymbol = new Map<NetworkSymbol, AddressValidator>();

    networks.networkModules.forEach(({ addressValidator }) => {
        addressValidator.getSupportedCoins().forEach(networkSymbol => {
            validatorByNetworkSymbol.set(networkSymbol, addressValidator);
        });
    });

    const getAddressType = (
        address: string,
        networkSymbol: NetworkSymbol,
    ): AddressType | undefined =>
        validatorByNetworkSymbol.get(networkSymbol)?.getAddressType(address, networkSymbol);

    const isAddressValid = (address: string, networkSymbol: NetworkSymbol): boolean =>
        validatorByNetworkSymbol.get(networkSymbol)?.isAddressValid(address, networkSymbol) ??
        false;

    const getSupportedCoins = (): NetworkSymbol[] => Array.from(validatorByNetworkSymbol.keys());

    return {
        isAddressValid,
        getAddressType,
        getSupportedCoins,
    };
};
