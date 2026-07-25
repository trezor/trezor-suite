import { type CryptoId } from 'invity-api';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { isAddressValid } from '@trezor/address-validator';

import { cryptoIdToSymbol } from '../../utils';

export const isReceiveAddressValid = (
    receiveAddress: string,
    receiveSymbol: NetworkSymbol,
): boolean => {
    try {
        return isAddressValid(receiveAddress, receiveSymbol);
    } catch {
        return false;
    }
};

type IsReceiveAddressCoherentProps = {
    receiveAddress: string | undefined;
    receiveCryptoId: CryptoId | undefined;
    receiveAccountKey: string | undefined;
    receiveAccountSymbol: NetworkSymbol | undefined;
};

export const isReceiveAddressCoherent = ({
    receiveAddress,
    receiveCryptoId,
    receiveAccountKey,
    receiveAccountSymbol,
}: IsReceiveAddressCoherentProps): boolean => {
    if (!receiveAddress) {
        return true;
    }

    const receiveSymbol = receiveCryptoId ? cryptoIdToSymbol(receiveCryptoId) : undefined;
    if (!receiveSymbol) {
        return false;
    }

    if (!isReceiveAddressValid(receiveAddress, receiveSymbol)) {
        return false;
    }

    if (receiveAccountKey) {
        return receiveAccountSymbol === receiveSymbol;
    }

    return true;
};
