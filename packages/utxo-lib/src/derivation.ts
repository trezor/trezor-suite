import { decode } from 'bs58';
import { throwError } from '@trezor/utils';
import { p2pkh, p2sh, p2wpkh, p2tr } from './payments';
import { fromBase58 } from './bip32';
import { bitcoin, Network } from './networks';

const BIP32_PAYMENT_TYPES = {
    0x0488b21e: 'p2pkh', // 76067358, xpub
    0x049d7cb2: 'p2sh', // 77429938, ypub
    0x04b24746: 'p2wpkh', // 78792518, zpub
    0x043587cf: 'p2pkh', // 70617039, tpub
    0x044a5262: 'p2sh', // 71979618, upub
    0x045f1cf6: 'p2wpkh', // 73342198, vpub
} as const;

const BIP32_COIN_TYPES = {
    0x0488b21e: "0'",
    0x049d7cb2: "0'",
    0x04b24746: "0'",
    0x043587cf: "1'",
    0x044a5262: "1'",
    0x045f1cf6: "1'",
} as const;

const BIP32_PURPOSES = {
    p2pkh: "44'",
    p2sh: "49'",
    p2wpkh: "84'",
    p2tr: "86'",
} as const;

type VersionBytes = keyof typeof BIP32_PAYMENT_TYPES;
type PaymentType = typeof BIP32_PAYMENT_TYPES[VersionBytes] | 'p2tr';

const validateVersion = (version: number): version is VersionBytes =>
    !!BIP32_PAYMENT_TYPES[version as VersionBytes];

const getVersion = (xpub: string) => {
    const version = decode(xpub).readUInt32BE();
    if (!validateVersion(version)) throw new Error(`Unknown xpub version: ${xpub}`);
    return version;
};

const getPubkeyToPayment = (type: PaymentType, network: Network) => (pubkey: Buffer) => {
    switch (type) {
        case 'p2pkh':
            return p2pkh({ pubkey, network });
        case 'p2sh':
            return p2sh({
                redeem: p2wpkh({
                    pubkey,
                    network,
                }),
                network,
            });
        case 'p2wpkh':
            return p2wpkh({ pubkey, network });
        case 'p2tr':
            return p2tr({ pubkey, network });
        default:
            throw new Error(`Unknown payment type '${type}'`);
    }
};

const getBip32Node = (xpub: string, version: VersionBytes, network: Network) =>
    fromBase58(xpub, {
        ...network,
        bip32: {
            ...network.bip32,
            public: version,
        },
    });

const getXpubInfo = (xpub: string, network: Network) => {
    const version = getVersion(xpub);
    const paymentType = BIP32_PAYMENT_TYPES[version];
    const coinType = BIP32_COIN_TYPES[version];
    const purpose = BIP32_PURPOSES[paymentType];
    const node = getBip32Node(xpub, version, network);
    // eslint-disable-next-line
    const account = `${(node.index << 1) >>> 1}'`; // Unsigned to signed conversion
    return {
        purpose,
        coinType,
        account,
        paymentType,
        node,
    };
};

const getDescriptorInfo = (paymentType: PaymentType, descriptor: string, network: Network) => {
    const [_match, _script, _fingerprint, purpose, coinType, account, xpub] =
        descriptor.match(
            /^([a-z]+\()+\[([a-z0-9]{8})\/([0-9]{2}'?)\/([01]'?)\/([0-9]+'?)\]([xyztuv]pub[a-zA-Z0-9]*)\/<0;1>\/\*\)+$/,
        ) || throwError(`Descriptor cannot be parsed: ${descriptor}`);
    const version = getVersion(xpub);
    const node = getBip32Node(xpub, version, network);
    return {
        purpose,
        coinType,
        account,
        paymentType,
        node,
    };
};

const getXpubOrDescriptorInfo = (descriptor: string, network: Network) => {
    if (descriptor.startsWith('pkh(')) {
        return getDescriptorInfo('p2pkh', descriptor, network);
    }
    if (descriptor.startsWith('sh(wpkh(')) {
        return getDescriptorInfo('p2sh', descriptor, network);
    }
    if (descriptor.startsWith('wpkh(')) {
        return getDescriptorInfo('p2wpkh', descriptor, network);
    }
    if (descriptor.startsWith('tr(')) {
        return getDescriptorInfo('p2tr', descriptor, network);
    }
    return getXpubInfo(descriptor, network);
};

export const deriveAddresses = (
    descriptor: string,
    type: 'receive' | 'change',
    from: number,
    count: number,
    network: Network = bitcoin,
): {
    address: string;
    path: string;
}[] => {
    const { purpose, coinType, account, node, paymentType } = getXpubOrDescriptorInfo(
        descriptor,
        network,
    );
    const getAddress = getPubkeyToPayment(paymentType, network);
    const change = type === 'receive' ? 0 : 1;
    const changeNode = node.derive(change);
    return Array.from(Array(count).keys())
        .map(i => changeNode.derive(from + i).publicKey)
        .map(a => getAddress(a).address || throwError('Cannot convert pubkey to address'))
        .map((address, i) => ({
            address,
            path: `m/${purpose}/${coinType}/${account}/${change}/${from + i}`,
        }));
};
