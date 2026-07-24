import { keccak_256 } from '@noble/hashes/sha3.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { base58 } from '@scure/base';

import type { BackendType, NetworkSymbol } from '@suite-common/wallet-config';
import { BlockbookProxyMock, PASSTHROUGH, SolanaRpcServerMock } from '@trezor/e2e-utils';
import { Transaction, networks } from '@trezor/utxo-lib';

import {
    getSignatureStatusesResponse,
    sendTransactionResponse,
} from '../../../fixtures/solana-responses';

// A live passthru backend for one network, set as its custom backend so it also reaches the
// blockchain-link worker (unlike page.route). Everything is forwarded to the live upstream
// except the outbound broadcast, which is answered locally so no real crypto ever leaves.
//
// This adapter is the only place chain specifics live (Solana's tx-derived signature, the
// Blockbook chains' tx-derived txid); TradingMockNew stays chain-agnostic.
export interface TradingChainBackend {
    readonly backendType: BackendType;
    readonly url: string;
    start(): Promise<void>;
    stop(): Promise<void>;
    blockBroadcast(): void;
}

const SOL_UPSTREAM_URL = 'https://sol.trezor.io/';
const ETH_UPSTREAM_URL = 'wss://eth1.trezor.io/websocket';
const BTC_UPSTREAM_URL = 'wss://btc1.trezor.io/websocket';

// An Ethereum txid is keccak256 of the exact bytes broadcast (the raw signed tx, legacy or typed).
const deriveEthTxid = (rawSignedTxHex: string) =>
    `0x${bytesToHex(keccak_256(Buffer.from(rawSignedTxHex.replace(/^0x/, ''), 'hex')))}`;

// A Bitcoin txid is the double-SHA256 of the non-witness serialization, byte-reversed. Derive it
// with the same primitive Connect uses (createPendingTx), so the push txid matches redux state.
const deriveBtcTxid = (rawSignedTxHex: string) =>
    Transaction.fromHex(rawSignedTxHex, { network: networks.bitcoin }).getId();

// Suite polls the signature derived from the signed tx, not the one the RPC returns. A
// single-signer tx starts with the signature count byte followed by the 64-byte signature.
const extractTxSignature = (base64Tx: string) =>
    base58.encode(Buffer.from(base64Tx, 'base64').subarray(1, 65));

class SolanaTradingBackend implements TradingChainBackend {
    readonly backendType: BackendType = 'solana';
    private readonly server = new SolanaRpcServerMock(SOL_UPSTREAM_URL);
    private readonly blockedSignatures: string[] = [];

    get url() {
        return this.server.url;
    }

    blockBroadcast() {
        this.server.setHandler('sendTransaction', ([base64Tx]) => {
            this.blockedSignatures.push(extractTxSignature(String(base64Tx ?? '')));

            return sendTransactionResponse('0').result;
        });

        // Fake confirmation only for the blocked sends; other signature queries stay live.
        this.server.setHandler('getSignatureStatuses', ([signatures]) =>
            (signatures as string[])?.some(signature => this.blockedSignatures.includes(signature))
                ? getSignatureStatusesResponse('0').result
                : PASSTHROUGH,
        );
    }

    async start() {
        await this.server.start();
    }

    async stop() {
        await this.server.stop();
    }
}

// One backend for both Blockbook chains (BTC, ETH): shared transport, with the upstream URL
// and txid derivation injected per chain.
class BlockbookTradingBackend implements TradingChainBackend {
    readonly backendType: BackendType = 'blockbook';
    private readonly proxy: BlockbookProxyMock;

    constructor(
        upstreamUrl: string,
        private readonly deriveTxid: (rawSignedTxHex: string) => string,
    ) {
        this.proxy = new BlockbookProxyMock(upstreamUrl);
    }

    get url() {
        return this.proxy.url;
    }

    blockBroadcast() {
        this.proxy.setHandler('sendTransaction', params => {
            const { hex } = params as { hex: string };

            return { result: this.deriveTxid(hex) };
        });
    }

    async start() {
        await this.proxy.start();
    }

    async stop() {
        await this.proxy.stop();
    }
}

export const createTradingChainBackend = (symbol: NetworkSymbol): TradingChainBackend => {
    switch (symbol) {
        case 'sol':
            return new SolanaTradingBackend();
        case 'eth':
            return new BlockbookTradingBackend(ETH_UPSTREAM_URL, deriveEthTxid);
        case 'btc':
            return new BlockbookTradingBackend(BTC_UPSTREAM_URL, deriveBtcTxid);
        default:
            throw new Error(`No trading chain backend adapter for '${symbol}'`);
    }
};
