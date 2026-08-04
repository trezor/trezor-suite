import { type CryptoId } from 'invity-api';

import { type AddressValidator } from '@suite-common/address';
import { type NetworkConfigDeps, type NetworkSymbol } from '@suite-common/wallet-config';

import { cryptoIdToSymbol } from '../../utils';

export const isReceiveAddressValid = (
    addressValidator: AddressValidator,
    receiveAddress: string,
    receiveSymbol: NetworkSymbol,
): boolean => {
    try {
        return addressValidator.isAddressValid(receiveAddress, receiveSymbol);
    } catch {
        return false;
    }
};

type IsReceiveAddressCoherentProps = NetworkConfigDeps & {
    addressValidator: AddressValidator;
    receiveAddress: string | undefined;
    receiveCryptoId: CryptoId | undefined;
    receiveAccountKey: string | undefined;
    receiveAccountSymbol: NetworkSymbol | undefined;
};

export const isReceiveAddressCoherent = ({
    addressValidator,
    receiveAddress,
    receiveCryptoId,
    receiveAccountKey,
    receiveAccountSymbol,
    ...deps
}: IsReceiveAddressCoherentProps): boolean => {
    if (!receiveAddress) {
        return true;
    }

    const receiveSymbol = receiveCryptoId ? cryptoIdToSymbol(deps, receiveCryptoId) : undefined;
    if (!receiveSymbol) {
        return false;
    }

    if (!isReceiveAddressValid(addressValidator, receiveAddress, receiveSymbol)) {
        return false;
    }

    if (receiveAccountKey) {
        return receiveAccountSymbol === receiveSymbol;
    }

    return true;
};
