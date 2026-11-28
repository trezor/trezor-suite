// origin: https://github.com/trezor/connect/blob/develop/src/js/data/CoinInfo.js
import { ERRORS } from '@trezor/connect-common/src/constants';
import {
    type BitcoinNetworkInfo,
    type CoinInfo,
    type CoinSymbol,
    type EthereumNetworkInfo,
    type MiscNetworkInfo,
    asCoinSymbol,
} from '@trezor/connect-common/src/types/coinInfo';
import coinsEth from '@trezor/connect-data/files/coins-eth.json';
import coins from '@trezor/connect-data/files/coins.json';
import {
    HD_HARDENED_PATH_PART,
    fromHardenedPathPart,
    toHardenedPathPart,
} from '@trezor/crypto-utils';
import { cloneObject } from '@trezor/utils';

const bitcoinNetworks: BitcoinNetworkInfo[] = [];
const ethereumNetworks: EthereumNetworkInfo[] = [];
const miscNetworks: MiscNetworkInfo[] = [];

export const getBitcoinNetwork = (
    symbolOrPath: CoinSymbol | number[],
): Readonly<BitcoinNetworkInfo> | undefined => {
    if (typeof symbolOrPath === 'string') {
        const shortcut = symbolOrPath.toLowerCase();

        return bitcoinNetworks.find(n => n.shortcut.toLowerCase() === shortcut);
    }
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const pathElement: number = symbolOrPath[1];
    const slip44 = fromHardenedPathPart(pathElement);

    return bitcoinNetworks.find(n => n.slip44 === slip44);
};

// Bitcoin-family variant of `getCoinInfoOrThrow`: keeps the search scoped to bitcoin
// networks (rejecting eth/misc symbols) and preserves the `CoinSymbol | number[]` input,
// so it can replace the repeated `getBitcoinNetwork(x)` + manual `Method_UnknownCoin` throw.
export const getBitcoinNetworkOrThrow = (
    symbolOrPath: CoinSymbol | number[],
): Readonly<BitcoinNetworkInfo> => {
    const coinInfo = getBitcoinNetwork(symbolOrPath);
    if (!coinInfo) {
        throw ERRORS.TypedError('Method_UnknownCoin');
    }

    return coinInfo;
};

export const getEthereumNetwork = (
    symbolOrPath: CoinSymbol | number[],
): Readonly<EthereumNetworkInfo> | undefined => {
    if (typeof symbolOrPath === 'string') {
        const networkSymbol = symbolOrPath.toLowerCase();

        return ethereumNetworks.find(network => network.shortcut.toLowerCase() === networkSymbol);
    }

    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const ethPathElement: number = symbolOrPath[1];
    const slip44 = fromHardenedPathPart(ethPathElement);

    return ethereumNetworks.find(n => n.slip44 === slip44);
};

export const getMiscNetwork = (
    symbolOrPath: CoinSymbol | number[],
): Readonly<MiscNetworkInfo> | undefined => {
    if (typeof symbolOrPath === 'string') {
        const shortcut = symbolOrPath.toLowerCase();

        return miscNetworks.find(n => n.shortcut.toLowerCase() === shortcut);
    }
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const miscPathElement: number = symbolOrPath[1];
    const slip44 = fromHardenedPathPart(miscPathElement);

    return miscNetworks.find(n => n.slip44 === slip44);
};

// Misc networks whose key is the node that `getPublicKey` and `getAddress` derive at their path,
// with the curve of that node. Cardano and Monero keys are not that node, and testnets are left out
// because SLIP-44 registers a coin type to the mainnet. The curves are listed here because
// coins.json gives Nostr ed25519, while firmware derives its key on secp256k1.
const miscNetworkNodeCurves: Partial<Record<string, string>> = {
    NOSTR: 'secp256k1',
    SOL: 'ed25519',
    TRX: 'secp256k1',
    XLM: 'ed25519',
    XRP: 'secp256k1',
};

// The curve firmware derives on for an `ecdsaCurveName`. Without a name it is the coin's own,
// secp256k1 for every bitcoin network, and it compares names as C strings, up to the first NUL.
// Every secp256k1 variant (decred, groestl, smart) shares the "Bitcoin seed" master key and the
// curve, so it derives the same node.
const getNodeCurve = (curveName?: string) => {
    const curve = curveName?.split('\0')[0] || 'secp256k1';

    return curve.startsWith('secp256k1') ? 'secp256k1' : curve;
};

// The network whose key a `crossChain` call derives at `path` on `curveName`, for its permission to
// name. When that network cannot be told, the declared `coinInfo` stands rather than a coin-less
// (device-wide) permission.
export const getCoinInfoOfPath = (
    path: number[],
    coinInfo: Readonly<BitcoinNetworkInfo>,
    curveName?: string,
): Readonly<CoinInfo> => {
    const nodeCurve = getNodeCurve(curveName);
    const coinTypeElement = path[1];
    // Only a hardened second element is a SLIP-44 coin type.
    if (coinTypeElement === undefined || coinTypeElement < HD_HARDENED_PATH_PART) {
        return coinInfo;
    }

    const slip44 = fromHardenedPathPart(coinTypeElement);
    if (slip44 === coinInfo.slip44) {
        return coinInfo;
    }

    if (nodeCurve === 'secp256k1') {
        // Several bitcoin testnets share coin type 1 and none of them owns it.
        const [bitcoinNetwork, ...otherBitcoinNetworks] = bitcoinNetworks.filter(
            n => n.slip44 === slip44,
        );
        if (bitcoinNetwork) {
            return otherBitcoinNetworks.length ? coinInfo : bitcoinNetwork;
        }

        // Many ethereum networks share coin type 60, which SLIP-44 registers to the first of them,
        // Ethereum.
        const ethereumNetwork = ethereumNetworks.find(n => n.slip44 === slip44);
        if (ethereumNetwork) {
            return ethereumNetwork;
        }
    }

    return (
        miscNetworks.find(
            n => n.slip44 === slip44 && miscNetworkNodeCurves[n.shortcut] === nodeCurve,
        ) ?? coinInfo
    );
};

/*
 * Bitcoin networks
 */

export const getSegwitNetwork = (coin: BitcoinNetworkInfo) => {
    if (coin.segwit && typeof coin.xPubMagicSegwit === 'number') {
        return {
            ...coin.network,
            bip32: {
                ...coin.network.bip32,
                public: coin.xPubMagicSegwit,
            },
        };
    }

    return null;
};

export const getBech32Network = (coin: BitcoinNetworkInfo) => {
    if (coin.segwit && typeof coin.xPubMagicSegwitNative === 'number') {
        return {
            ...coin.network,
            bip32: {
                ...coin.network.bip32,
                public: coin.xPubMagicSegwitNative,
            },
        };
    }

    return null;
};

// fix coinInfo network values from path (segwit/legacy)
export const fixCoinInfoNetwork = (ci: BitcoinNetworkInfo, path: number[]) => {
    const coinInfo = cloneObject(ci);
    if (path[0] === toHardenedPathPart(84)) {
        const bech32Network = getBech32Network(coinInfo);
        if (bech32Network) {
            coinInfo.network = bech32Network;
        }
    } else if (path[0] === toHardenedPathPart(49)) {
        const segwitNetwork = getSegwitNetwork(coinInfo);
        if (segwitNetwork) {
            coinInfo.network = segwitNetwork;
        }
    } else {
        coinInfo.segwit = false;
    }

    return coinInfo;
};

const getCoinInfo = (coin: CoinSymbol) =>
    getBitcoinNetwork(coin) || getEthereumNetwork(coin) || getMiscNetwork(coin);

export const getCoinInfoOrThrow = (coin: string): Readonly<CoinInfo> => {
    // `coin` is unvalidated caller input; a non-shortcut resolves to undefined below
    const coinInfo = getCoinInfo(asCoinSymbol(coin));
    if (!coinInfo) {
        throw ERRORS.TypedError('Method_UnknownCoin');
    }

    return coinInfo;
};

export const getCoinName = (path: number[]) => {
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const coinNamePathElement: number = path[1];
    const slip44 = fromHardenedPathPart(coinNamePathElement);
    const network = ethereumNetworks.find(n => n.slip44 === slip44);

    return network ? network.name : 'Unknown coin';
};

const BITCOIN_SHORTCUTS = ['BTC', 'TEST', 'REGTEST'];

const parseBitcoinNetworksJson = (json: any) => {
    Object.keys(json).forEach(key => {
        const coin = json[key];
        const shortcut = coin.coin_shortcut;

        const isBitcoin = BITCOIN_SHORTCUTS.includes(shortcut);

        const network = {
            messagePrefix: coin.signed_message_header,
            bech32: coin.bech32_prefix,
            bip32: {
                public: coin.xpub_magic,
                private: coin.xprv_magic,
            },
            pubKeyHash: coin.address_type,
            scriptHash: coin.address_type_p2sh,
            forkId: coin.fork_id,
            wif: 0, // doesn't matter, for type correctness
        };

        bitcoinNetworks.push({
            type: 'bitcoin',
            // address_type in Network
            // address_type_p2sh in Network
            // bech32_prefix in Network
            // consensus_branch_id in Network
            // bip115: not used
            // bitcore: not used,
            // blockbook: not used,
            // blockchain_link in @trezor/blockchain-core
            cashAddrPrefix: coin.cashaddr_prefix,
            label: coin.coin_label,
            name: coin.coin_name,
            shortcut,
            // cooldown not used
            curveName: coin.curve_name,
            forceBip143: coin.force_bip143,
            // forkid in Network
            // github not used
            hashGenesisBlock: coin.hash_genesis_block,
            // key not used
            // maintainer not used
            maxAddressLength: coin.max_address_length,
            maxFeeSatoshiKb: coin.maxfee_kb,
            minAddressLength: coin.min_address_length,
            minFeeSatoshiKb: coin.minfee_kb,
            // name: same as coin_label
            segwit: coin.segwit,
            // signed_message_header in Network
            slip44: coin.slip44,
            support: coin.support,
            // uri_prefix not used
            // version_group_id not used
            // website not used
            // xprv_magic in Network
            xPubMagic: coin.xpub_magic,
            xPubMagicSegwitNative: coin.xpub_magic_segwit_native,
            xPubMagicSegwit: coin.xpub_magic_segwit_p2sh,
            taproot: coin.taproot,

            // custom
            network, // bitcoinjs network
            isBitcoin,

            decimals: coin.decimals,
            dustLimit: coin.dust_limit,
        });
    });
};

export const ethereumNetworkInfoBase = {
    type: 'ethereum' as const,
    decimals: 18,
};

const parseEthereumNetworksJson = (json: any) => {
    Object.keys(json).forEach(key => {
        const network = json[key];

        ethereumNetworks.push({
            ...ethereumNetworkInfoBase,
            chainId: network.chain_id,
            label: network.label,
            name: network.name,
            shortcut: network.shortcut,
            slip44: network.slip44,
            support: network.support,
        });
    });
};

const parseMiscNetworksJSON = (json: any) => {
    Object.keys(json).forEach(key => {
        const network = json[key];
        miscNetworks.push({
            type: 'misc',
            curve: network.curve,
            label: network.name,
            name: network.name,
            shortcut: network.shortcut,
            slip44: network.slip44,
            support: network.support,
            decimals: network.decimals,
        });
    });
};

const parseCoinsJson = (json: any) => {
    Object.keys(json).forEach(key => {
        switch (key) {
            case 'bitcoin':
                return parseBitcoinNetworksJson(json[key]);
            case 'eth':
                return parseEthereumNetworksJson(json[key]);
            case 'misc':
                return parseMiscNetworksJSON(json[key]);
            // no default
        }
    });
};

export const getUniqueNetworks = <T extends { shortcut: string }>(networks: (T | undefined)[]) =>
    networks.reduce((result: T[], info?: T) => {
        if (!info || result.find(i => i.shortcut === info.shortcut)) return result;

        return result.concat(info);
    }, []);

export const getAllNetworks = (): CoinInfo[] => [
    ...bitcoinNetworks,
    ...ethereumNetworks,
    ...miscNetworks,
];

// Populate the network registries from the bundled coin definitions on module load.
parseCoinsJson({ ...coins, ...coinsEth });
