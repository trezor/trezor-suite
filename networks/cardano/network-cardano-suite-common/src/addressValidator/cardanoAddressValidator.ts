import { base58, bech32 } from '@scure/base';
import * as cbor from 'cbor';
import crc32 from 'crc/calculators/crc32';

import { type AddressValidator, addressType } from '@trezor/network-module-suite-common-types';

import type { CardanoNetworkSymbol } from '../supportedNetworks';

type NetworkEnvironment = 'prod' | 'testnet' | 'regtest' | 'stake';

const CARDANO_HRP: Record<string, string> = { prod: 'addr', testnet: 'addr_test', stake: 'stake' };

const getNetworkEnvironment = (address: string): NetworkEnvironment => {
    if (address.startsWith('stake')) {
        return 'stake';
    }
    if (address.startsWith('addr_test')) {
        return 'testnet';
    }

    return 'prod';
};

function getDecoded(address: string): any {
    try {
        const decoded = base58.decode(address);

        return cbor.decode(new Uint8Array(decoded).buffer);
    } catch {
        return null;
    }
}

function isValidLegacyAddress(address: string): boolean {
    const decoded = getDecoded(address);
    if (!decoded || !Array.isArray(decoded) || decoded.length !== 2) {
        return false;
    }

    const tagged = decoded[0];
    const taggedValue = tagged?.value;
    const validCrc = decoded[1];
    if (
        taggedValue === null ||
        typeof taggedValue === 'undefined' ||
        typeof validCrc !== 'number'
    ) {
        return false;
    }
    // Coerce signed crc32 output to unsigned to match the CBOR-decoded checksum.
    const crc = crc32(taggedValue) >>> 0;

    return crc === validCrc;
}

function isValidBech32Address(address: string, network: NetworkEnvironment): boolean {
    const hrp = CARDANO_HRP[network];
    if (!hrp) {
        return false;
    }

    let dec;
    try {
        dec = bech32.decode(address as `${string}1${string}`, network === 'prod' ? 103 : 108);
    } catch {
        return false;
    }

    if (dec.prefix !== hrp || dec.words.length < 1) {
        return false;
    }

    const [firstWord] = dec.words;
    if (firstWord === undefined || (firstWord > 16 && network !== 'stake')) {
        return false;
    }

    return true;
}

export const isAddressValid = (address: string, _symbol: CardanoNetworkSymbol): boolean => {
    const resolvedNetwork = getNetworkEnvironment(address);

    return isValidLegacyAddress(address) || isValidBech32Address(address, resolvedNetwork);
};

export const getAddressType = (address: string, symbol: CardanoNetworkSymbol) => {
    if (isAddressValid(address, symbol)) {
        return addressType.ADDRESS;
    }

    return undefined;
};

export const adaValidator: AddressValidator<CardanoNetworkSymbol> = {
    isAddressValid,
    getAddressType,
};
