import type { BitcoinNetworkInfo } from '@trezor/connect-common';
import { type Network, networks } from '@trezor/utxo-lib';

/** Bitcoin mainnet. Extended public keys of this network are serialized with the `xpub` prefix. */
export const BITCOIN_NETWORK: Network = networks.bitcoin;

/** Bitcoin mainnet with the SLIP-132 `ypub` prefix used for P2SH-wrapped SegWit accounts. */
export const BITCOIN_P2SH_SEGWIT_NETWORK: Network = {
    ...networks.bitcoin,
    bip32: { ...networks.bitcoin.bip32, public: 0x049d7cb2 },
};

/** Bitcoin mainnet with the SLIP-132 `zpub` prefix used for native SegWit accounts. */
export const BITCOIN_NATIVE_SEGWIT_NETWORK: Network = {
    ...networks.bitcoin,
    bip32: { ...networks.bitcoin.bip32, public: 0x04b24746 },
};

export const BITCOIN_DUST_LIMIT = 546;

/** Trezor's Bitcoin blockbook. The page reads from it and links the user to its explorer pages. */
export const BITCOIN_BLOCKBOOK_URL = 'https://btc.trezor.io';

export const BLOCKBOOK_URLS = [BITCOIN_BLOCKBOOK_URL];

/**
 * Independent decoder the user checks a signed transaction in before broadcasting it. BlockCypher's
 * decode API was checked against a real transaction: outputs and addresses come back right.
 */
export const BITCOIN_TRANSACTION_DECODER_URL = 'https://live.blockcypher.com/btc/decodetx/';

/** Blockbook's "Send Raw Transaction" form, where the user broadcasts the hex. */
export const BITCOIN_SEND_TRANSACTION_URL = `${BITCOIN_BLOCKBOOK_URL}/sendtx`;

/** The explorer page of a transaction. It works once the transaction is broadcast. */
export const getBitcoinTransactionUrl = (txid: string) => `${BITCOIN_BLOCKBOOK_URL}/tx/${txid}`;

/**
 * Coin description required by the signing helper of @trezor/connect-core. The helper reads only
 * `name` and `isBitcoin`; the remaining fields mirror the Bitcoin entry of connect's coin list.
 */
export const BITCOIN_COIN_INFO: BitcoinNetworkInfo = {
    type: 'bitcoin',
    label: 'Bitcoin',
    name: 'Bitcoin',
    shortcut: 'BTC',
    slip44: 0,
    support: {
        T1B1: '1.5.2',
        T2T1: '2.0.5',
        T2B1: '2.6.1',
        T3B1: '2.8.1',
        T3T1: '2.6.1',
        T3W1: '2.6.1',
        UNKNOWN: false,
    },
    decimals: 8,
    blockchainLink: { type: 'blockbook', url: BLOCKBOOK_URLS },
    blockTime: 10,
    minFee: 0.1,
    maxFee: 2000,
    minPriorityFee: -1,
    defaultFees: [],
    curveName: 'secp256k1',
    dustLimit: BITCOIN_DUST_LIMIT,
    forceBip143: false,
    hashGenesisBlock: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
    maxAddressLength: 34,
    maxFeeSatoshiKb: 2000000,
    minAddressLength: 27,
    minFeeSatoshiKb: 100,
    segwit: true,
    xPubMagic: BITCOIN_NETWORK.bip32.public,
    xPubMagicSegwit: BITCOIN_P2SH_SEGWIT_NETWORK.bip32.public,
    xPubMagicSegwitNative: BITCOIN_NATIVE_SEGWIT_NETWORK.bip32.public,
    taproot: true,
    network: BITCOIN_NETWORK,
    isBitcoin: true,
};
