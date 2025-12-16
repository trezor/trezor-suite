import cnBase58 from './crypto/cnBase58';
import { addressType, keccak256Checksum } from './crypto/utils';
import type { AddressType, Currency, NetworkType } from './types';

const DEFAULT_NETWORK_TYPE: NetworkType = 'prod';

const addressRegTest = new RegExp(
    '^L[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{94}$',
);
const integratedAddressRegTest = new RegExp(
    '^L[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{105}$',
);

function validateNetwork(
    decoded: string,
    currency: Currency,
    networkType: NetworkType,
    detectedType: 'standard' | 'integrated' | 'subaddress',
): boolean {
    let network = currency.addressTypes;
    if (detectedType === 'integrated') {
        network = currency.iAddressTypes;
    } else if (detectedType === 'subaddress') {
        network = currency.subAddressTypes;
    }
    if (!network) return false;
    const at = parseInt(decoded.substr(0, 2), 16).toString();

    switch (networkType) {
        case 'prod':
            return network.prod?.indexOf(at) >= 0;
        case 'testnet':
            return network.testnet?.indexOf(at) >= 0;
        case 'both':
            return (
                (network.prod?.indexOf(at) ?? -1) >= 0 || (network.testnet?.indexOf(at) ?? -1) >= 0
            );
        default:
            return false;
    }
}

function hextobin(hex: string): Uint8Array | null {
    if (hex.length % 2 !== 0) return null;
    const res = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length / 2; ++i) {
        res[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }

    return res;
}

function isValidAddress(
    address: string,
    currency: Currency,
    networkType: NetworkType = DEFAULT_NETWORK_TYPE,
): boolean {
    let detectedType: 'standard' | 'integrated' | 'subaddress' = 'standard';
    if (!addressRegTest.test(address)) {
        if (integratedAddressRegTest.test(address)) {
            detectedType = 'integrated';
        } else {
            return false;
        }
    }

    const decodedAddrStr = cnBase58.decode(address);
    if (!decodedAddrStr) return false;

    if (!validateNetwork(decodedAddrStr, currency, networkType, detectedType)) return false;

    const addrChecksum = decodedAddrStr.slice(-8);
    const payloadBytes = hextobin(decodedAddrStr.slice(0, -8));
    if (!payloadBytes) return false;
    const hashChecksum = keccak256Checksum(payloadBytes);

    return addrChecksum === hashChecksum;
}

function getAddressType(
    address: string,
    currency: Currency,
    networkType: NetworkType = DEFAULT_NETWORK_TYPE,
): AddressType | undefined {
    if (isValidAddress(address, currency, networkType)) {
        return addressType.ADDRESS;
    }

    return undefined;
}

export { isValidAddress, getAddressType };
