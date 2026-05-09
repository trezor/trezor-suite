import cnBase58Module from './crypto/cnBase58';
import * as cryptoUtils from './crypto/utils';
import { addressType } from './crypto/utils';

const cnBase58 = cnBase58Module as any;

const DEFAULT_NETWORK_TYPE = 'prod';

const addressRegTest = new RegExp(
    '^L[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{94}$',
);
const integratedAddressRegTest = new RegExp(
    '^L[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{105}$',
);

function validateNetwork(
    decoded: string,
    currency: any,
    networkType: string,
    addrKind: string,
): boolean {
    let network = currency.addressTypes;
    if (addrKind === 'integrated') {
        network = currency.iAddressTypes;
    } else if (addrKind === 'subaddress') {
        network = currency.subAddressTypes;
    }
    const at = parseInt(decoded.substr(0, 2), 16).toString();

    switch (networkType) {
        case 'prod':
            return network.prod.includes(at);
        case 'testnet':
            return network.testnet.includes(at);
        case 'both':
            return network.prod.includes(at) || network.testnet.includes(at);
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

export const isValidAddress = (address: string, currency?: any, networkType?: string): boolean => {
    const network = networkType || DEFAULT_NETWORK_TYPE;
    let addrKind = 'standard';
    if (!addressRegTest.test(address)) {
        if (integratedAddressRegTest.test(address)) {
            addrKind = 'integrated';
        } else {
            return false;
        }
    }

    const decodedAddrStr = cnBase58.decode(address);
    if (!decodedAddrStr) return false;

    if (!validateNetwork(decodedAddrStr, currency, network, addrKind)) return false;

    const addrChecksum = decodedAddrStr.slice(-8);
    const hashChecksum = cryptoUtils.keccak256Checksum(
        hextobin(decodedAddrStr.slice(0, -8)) as Uint8Array,
    );

    return addrChecksum === hashChecksum;
};

export const getAddressType = (address: string, currency?: any, networkType?: string) => {
    if (isValidAddress(address, currency, networkType)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
