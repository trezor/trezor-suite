import { ERRORS } from '../constants';
import type {
    CoinInfo,
    BitcoinNetworkInfo,
    EthereumNetworkInfo,
    MiscNetworkInfo,
} from '../types/coinInfo';

// REF-TODO: use @trezor/utils
import { toHardened, fromHardened } from '../utils/pathUtils';

const bitcoinNetworks: BitcoinNetworkInfo[] = [];
const ethereumNetworks: EthereumNetworkInfo[] = [];
const miscNetworks: MiscNetworkInfo[] = [];

export function cloneCoinInfo<T>(info: T): T {
    const jsonString = JSON.stringify(info);
    if (jsonString === undefined) {
        // jsonString === undefined IF and only IF obj === undefined
        // therefore no need to clone
        return info;
    }
    return JSON.parse(jsonString);
}

export const getBitcoinNetwork = (pathOrName: number[] | string) => {
    const networks = cloneCoinInfo(bitcoinNetworks);
    if (typeof pathOrName === 'string') {
        const name = pathOrName.toLowerCase();
        return networks.find(
            n =>
                n.name.toLowerCase() === name ||
                n.shortcut.toLowerCase() === name ||
                n.label.toLowerCase() === name,
        );
    }
    const slip44 = fromHardened(pathOrName[1]);
    return networks.find(n => n.slip44 === slip44);
};

export const getEthereumNetwork = (pathOrName: number[] | string) => {
    const networks = cloneCoinInfo(ethereumNetworks);
    if (typeof pathOrName === 'string') {
        const name = pathOrName.toLowerCase();
        return networks.find(
            n => n.name.toLowerCase() === name || n.shortcut.toLowerCase() === name,
        );
    }
    const slip44 = fromHardened(pathOrName[1]);
    return networks.find(n => n.slip44 === slip44);
};

export const getMiscNetwork = (pathOrName: number[] | string) => {
    const networks = cloneCoinInfo(miscNetworks);
    if (typeof pathOrName === 'string') {
        const name = pathOrName.toLowerCase();
        return networks.find(
            n => n.name.toLowerCase() === name || n.shortcut.toLowerCase() === name,
        );
    }
    const slip44 = fromHardened(pathOrName[1]);
    return networks.find(n => n.slip44 === slip44);
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
    const coinInfo = cloneCoinInfo(ci);
    if (path[0] === toHardened(84)) {
        const bech32Network = getBech32Network(coinInfo);
        if (bech32Network) {
            coinInfo.network = bech32Network;
        }
    } else if (path[0] === toHardened(49)) {
        const segwitNetwork = getSegwitNetwork(coinInfo);
        if (segwitNetwork) {
            coinInfo.network = segwitNetwork;
        }
    } else {
        coinInfo.segwit = false;
    }
    return coinInfo;
};

// REF-TODO: not really used at the moment
const detectBtcVersion = (data: { subversion?: string }) => {
    if (data.subversion == null) {
        return 'btc';
    }
    if (data.subversion.startsWith('/Bitcoin ABC')) {
        return 'bch';
    }
    if (data.subversion.startsWith('/Bitcoin Cash')) {
        return 'bch';
    }
    if (data.subversion.startsWith('/Bitcoin Gold')) {
        return 'btg';
    }
    return 'btc';
};

// REF-TODO: not used anywhere at the moment.
export const getCoinInfoByHash = (hash: string, networkInfo: any) => {
    const networks = cloneCoinInfo(bitcoinNetworks);
    const result = networks.find(
        info => hash.toLowerCase() === info.hashGenesisBlock.toLowerCase(),
    );
    if (!result) {
        throw ERRORS.TypedError(
            'Method_UnknownCoin',
            `Coin info not found for hash: ${hash} ${networkInfo.hashGenesisBlock}`,
        );
    }

    if (result.isBitcoin) {
        const btcVersion = detectBtcVersion(networkInfo);
        let fork: BitcoinNetworkInfo | undefined;
        if (btcVersion === 'bch') {
            fork = networks.find(info => info.name === 'Bcash');
        } else if (btcVersion === 'btg') {
            fork = networks.find(info => info.name === 'Bgold');
        }
        if (fork) {
            return fork;
        }
        throw ERRORS.TypedError(
            'Method_UnknownCoin',
            `Coin info not found for hash: ${hash} ${networkInfo.hashGenesisBlock} BTC version:${btcVersion}`,
        );
    }
    return result;
};

export const getCoinInfo = (currency: string) =>
    getBitcoinNetwork(currency) || getEthereumNetwork(currency) || getMiscNetwork(currency);

export const getCoinName = (path: number[]) => {
    const slip44 = fromHardened(path[1]);
    const network = ethereumNetworks.find(n => n.slip44 === slip44);
    return network ? network.name : 'Unknown coin';
};

const parseBitcoinNetworksJson = (json: any) => {
    Object.keys(json).forEach(key => {
        const coin = json[key];
        const shortcut = coin.coin_shortcut;
        const isBitcoin = shortcut === 'BTC' || shortcut === 'TEST';
        const hasTimestamp = shortcut === 'CPC' || shortcut === 'PPC' || shortcut === 'tPPC';

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
            consensusBranchId: coin.consensus_branch_id, // zcash, komodo
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
            blockchainLink: coin.blockchain_link,
            blocktime: Math.round(coin.blocktime_seconds / 60),
            cashAddrPrefix: coin.cashaddr_prefix,
            label: coin.coin_label,
            name: coin.coin_name,
            shortcut,
            // cooldown not used
            curveName: coin.curve_name,
            // decred not used
            defaultFees: coin.default_fee_b,
            dustLimit: coin.dust_limit,
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
            hasTimestamp,
            maxFee: Math.round(coin.maxfee_kb / 1000),
            minFee: Math.round(coin.minfee_kb / 1000),

            // used in backend ?
            blocks: Math.round(coin.blocktime_seconds / 60),
            decimals: coin.decimals,
        });
    });
};

const parseEthereumNetworksJson = (json: any) => {
    Object.keys(json).forEach(key => {
        const network = json[key];
        ethereumNetworks.push({
            type: 'ethereum',
            blockchainLink: network.blockchain_link,
            blocktime: -1, // unknown
            chain: network.chain,
            chainId: network.chain_id,
            // key not used
            defaultFees: [
                {
                    label: 'normal',
                    feePerUnit: '5000000000',
                    feeLimit: '21000',
                },
            ],
            minFee: 1,
            maxFee: 10000,
            label: network.name,
            name: network.name,
            shortcut: network.shortcut,
            rskip60: network.rskip60,
            slip44: network.slip44,
            support: network.support,
            // url not used
            network: undefined,
            decimals: 16,
        });
    });
};

const parseMiscNetworksJSON = (json: any, type?: 'misc' | 'nem') => {
    Object.keys(json).forEach(key => {
        const network = json[key];
        let minFee = -1; // unknown
        let maxFee = -1; // unknown
        let defaultFees = { Normal: -1 }; // unknown
        const shortcut = network.shortcut.toLowerCase();
        if (shortcut === 'xrp' || shortcut === 'txrp') {
            minFee = 10;
            maxFee = 10000;
            defaultFees = { Normal: 12 };
        }
        if (shortcut === 'ada' || shortcut === 'tada') {
            minFee = 44;
            // max tx size * lovelace per byte + base fee
            maxFee = 16384 * 44 + 155381;
            defaultFees = { Normal: 44 };
        }
        miscNetworks.push({
            type: type || 'misc',
            blockchainLink: network.blockchain_link,
            blocktime: -1,
            curve: network.curve,
            // REF-TODO: connect types should be updated maybe?
            // @ts-ignore
            defaultFees,
            minFee,
            maxFee,
            label: network.name,
            name: network.name,
            shortcut: network.shortcut,
            slip44: network.slip44,
            support: network.support,
            network: undefined,
            decimals: network.decimals,
        });
    });
};

export const parseCoinsJson = (json: any) => {
    Object.keys(json).forEach(key => {
        switch (key) {
            case 'bitcoin':
                return parseBitcoinNetworksJson(json[key]);
            case 'eth':
                return parseEthereumNetworksJson(json[key]);
            case 'misc':
                return parseMiscNetworksJSON(json[key]);
            case 'nem':
                return parseMiscNetworksJSON(json[key], 'nem');
            // no default
        }
    });
};

export const getUniqueNetworks = (networks: CoinInfo[]) =>
    networks.reduce((result: CoinInfo[], info?: CoinInfo) => {
        if (!info || result.find(i => i.shortcut === info.shortcut)) return result;
        return result.concat(info);
    }, []);

export const getAllNetworks = () => [...bitcoinNetworks, ...ethereumNetworks, ...miscNetworks];
