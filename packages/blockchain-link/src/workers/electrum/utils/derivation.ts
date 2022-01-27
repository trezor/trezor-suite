import { decode } from 'bs58';
import { payments, bip32, networks } from '@trezor/utxo-lib';
import { fail } from './misc';

const BIP32_VERSIONS = {
    // 76067358, xpub
    0x0488b21e: {
        type: 'p2pkh',
        purpose: "44'",
        coinType: "0'",
    },
    // 77429938, ypub
    0x049d7cb2: {
        type: 'p2sh',
        purpose: "49'",
        coinType: "0'",
    },
    // 78792518, zpub
    0x04b24746: {
        type: 'p2wpkh',
        purpose: "84'",
        coinType: "0'",
    },
    // 70617039, tpub
    0x043587cf: {
        type: 'p2pkh',
        purpose: "44'",
        coinType: "1'",
    },
    // 71979618, upub
    0x044a5262: {
        type: 'p2sh',
        purpose: "49'",
        coinType: "1'",
    },
    // 73342198, vpub
    0x045f1cf6: {
        type: 'p2wpkh',
        purpose: "84'",
        coinType: "1'",
    },
} as const;

type Version = keyof typeof BIP32_VERSIONS;

const validateVersion = (version: number): version is Version =>
    !!BIP32_VERSIONS[version as Version];

type PaymentType = typeof BIP32_VERSIONS[Version]['type'] | 'p2tr';

const getPubkeyToPayment = (type: PaymentType, coinType: string) => (pubkey: Buffer) => {
    const network = coinType === "1'" ? networks.regtest : undefined;
    switch (type) {
        case 'p2pkh':
            return payments.p2pkh({ pubkey, network });
        case 'p2sh':
            return payments.p2sh({
                redeem: payments.p2wpkh({
                    pubkey,
                    network,
                }),
                network,
            });
        case 'p2wpkh':
            return payments.p2wpkh({ pubkey, network });
        case 'p2tr':
            return payments.p2tr({ pubkey, network });
        default:
            throw new Error(`Unknown payment type '${type}'`);
    }
};

const parseDescriptor = (descriptor: string) => {
    const [_match, _script, _fingerprint, purpose, coinType, account, xpub] =
        descriptor.match(
            /^([a-z]+\()+\[([a-z0-9]{8})\/([0-9]{2}'?)\/([01]'?)\/([0-9]+'?)\]([xyztuv]pub[a-zA-Z0-9]*)\/<0;1>\/\*\)+$/
        ) || fail(`Descriptor cannot be parsed: ${descriptor}`);
    return {
        purpose,
        coinType,
        account,
        xpub,
    };
};

const getXpubDefaults = (xpub: string) => {
    const version = decode(xpub).readUInt32BE();
    if (!validateVersion(version)) throw new Error(`Unknown xpub version: ${xpub}`);
    return {
        version,
        ...BIP32_VERSIONS[version],
    };
};

const getXpubInfo = (xpub: string) => {
    const { version, purpose, type, coinType } = getXpubDefaults(xpub);
    const node = bip32.fromBase58(xpub, {
        ...networks.bitcoin,
        bip32: {
            ...networks.bitcoin.bip32,
            public: version,
        },
    });
    // eslint-disable-next-line
    const account = `${(node.index << 1) >>> 1}'`; // Unsigned to signed conversion
    return {
        purpose,
        coinType,
        account,
        paymentType: type,
        node,
    };
};

const getDescriptorInfo = (descriptor: string, paymentType: PaymentType) => {
    const { xpub, purpose, coinType, account } = parseDescriptor(descriptor);
    const { node, ...rest } = getXpubInfo(xpub);
    if (rest.account !== account) {
        console.warn(`Account indices doesn't match: ${rest.account}, ${account}`);
    }
    return {
        purpose,
        coinType,
        account,
        paymentType,
        node,
    };
};

const recognizeDescriptor = (descriptor: string) => {
    if (descriptor.startsWith('pkh(')) {
        return getDescriptorInfo(descriptor, 'p2pkh');
    }
    if (descriptor.startsWith('sh(wpkh(')) {
        return getDescriptorInfo(descriptor, 'p2sh');
    }
    if (descriptor.startsWith('wpkh(')) {
        return getDescriptorInfo(descriptor, 'p2wpkh');
    }
    if (descriptor.startsWith('tr(')) {
        return getDescriptorInfo(descriptor, 'p2tr');
    }
    return getXpubInfo(descriptor);
};

export const deriveAddresses = (
    descriptor: string,
    type: 'receive' | 'change',
    from: number,
    count: number
): {
    address: string;
    path: string;
}[] => {
    const { purpose, coinType, account, node, paymentType } = recognizeDescriptor(descriptor);
    const getAddress = getPubkeyToPayment(paymentType, coinType);
    const change = type === 'receive' ? 0 : 1;
    const changeNode = node.derive(change);
    return Array.from(Array(count).keys())
        .map(i => changeNode.derive(from + i).publicKey)
        .map(a => getAddress(a).address || fail('Cannot convert pubkey to address'))
        .map((address, i) => ({
            address,
            path: `m/${purpose}/${coinType}/${account}/${change}/${from + i}`,
        }));
};
