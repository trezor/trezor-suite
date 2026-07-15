import { Page } from '@playwright/test';
import type { ExchangeTrade } from 'invity-api';

import { BlockbookProxyMock, PASSTHROUGH, SolanaRpcServerMock } from '@trezor/e2e-utils';

import { invityEndpoint } from '../../fixtures/invity';
import {
    getSignatureStatusesResponse,
    sendTransactionResponse,
} from '../../fixtures/solana-responses';
import { step } from '../common';

const base58Alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

const encodeBase58 = (bytes: Uint8Array) => {
    let num = BigInt(`0x${Buffer.from(bytes).toString('hex')}`);
    let encoded = '';

    while (num > 0n) {
        encoded = base58Alphabet[Number(num % 58n)] + encoded;
        num /= 58n;
    }

    for (const byte of bytes) {
        if (byte !== 0) {
            break;
        }
        encoded = `1${encoded}`;
    }

    return encoded;
};

// Suite polls the signature derived from the signed tx, not the one returned by the RPC.
// A single-signer tx starts with the signature count byte followed by the 64-byte signature.
const extractTxSignature = (base64Tx: string) =>
    encodeBase58(Buffer.from(base64Tx, 'base64').subarray(1, 65));

const solUpstreamUrl = 'https://sol.trezor.io/';
const ethUpstreamUrl = 'wss://eth1.trezor.io/websocket';
const fakeEthTxid = '0x1b4e7dfff573a40ae04daafa67798ee5984345a2bde5e5387d77493a6029690c';

// Passthrough mock for swap tests running against live backends and live Invity API.
// Everything passes through untouched except the transaction broadcast, which is
// blocked so no funds ever leave the account.
export class PassthruTradingMock {
    readonly watchPollPeriod = '00:30';

    private blockedTxSignatures: string[] = [];
    private blockedEthSends = 0;
    private liveTrade: ExchangeTrade | null = null;
    private solProxy: SolanaRpcServerMock | null = null;
    private ethProxy: BlockbookProxyMock | null = null;

    constructor(private page: Page) {
        this.validatePassphraseEnv();
    }

    get blockedSendCount() {
        return this.blockedTxSignatures.length + this.blockedEthSends;
    }

    // Number of live requests that flowed through the passthrough proxies. Non-zero value
    // proves the interception is active, so a broadcast cannot slip through it.
    get passthroughCount() {
        return (this.solProxy?.passthroughCount ?? 0) + (this.ethProxy?.passthroughCount ?? 0);
    }

    get liveTradeSendAddress() {
        if (!this.liveTrade?.sendAddress) {
            throw new Error('Live trade response was not captured yet');
        }

        return this.liveTrade.sendAddress;
    }

    // Solana RPC is HTTP, but page.route misses the blockchain-link worker on desktop. A local
    // passthrough backend (set as custom backend) forwards every method to the live upstream and
    // answers only the broadcast locally, so the same test can run on web and desktop.
    @step()
    async blockSolanaSends() {
        this.solProxy = new SolanaRpcServerMock(solUpstreamUrl);

        // IMPORTANT: answering this method locally is what prevents actually sending crypto
        this.solProxy.setHandler('sendTransaction', ([base64Tx]) => {
            this.blockedTxSignatures.push(extractTxSignature(String(base64Tx ?? '')));

            return sendTransactionResponse('0').result;
        });

        // Suite polls the tx-derived signature; fake confirmation only for blocked sends,
        // other signature queries stay live.
        this.solProxy.setHandler('getSignatureStatuses', ([signatures]) =>
            (signatures as string[])?.some(signature =>
                this.blockedTxSignatures.includes(signature),
            )
                ? getSignatureStatusesResponse('0').result
                : PASSTHROUGH,
        );

        await this.solProxy.start();

        return this.solProxy.url;
    }

    // ETH talks to Blockbook over WebSocket from a blockchain-link worker, out of reach of
    // page.route/routeWebSocket. A local passthrough proxy (set as custom backend) forwards
    // everything to the live upstream and answers only the broadcast locally.
    @step()
    async blockEthSends() {
        this.ethProxy = new BlockbookProxyMock(ethUpstreamUrl);
        // IMPORTANT: answering this method locally is what prevents actually sending crypto
        this.ethProxy.setHandler('sendTransaction', () => {
            this.blockedEthSends += 1;

            return { result: fakeEthTxid };
        });
        await this.ethProxy.start();

        return this.ethProxy.url;
    }

    async stop() {
        await this.solProxy?.stop();
        await this.ethProxy?.stop();
    }

    // Resolves with the live trade response (real order, real deposit address) once
    // Suite requests it. Must be called before the request is triggered.
    async waitForLiveTrade() {
        const response = await this.page.waitForResponse(invityEndpoint.swapTrade);
        this.liveTrade = (await response.json()) as ExchangeTrade;

        return this.liveTrade;
    }

    // The provider never receives the blocked payment, so the live watch endpoint would
    // never progress - watch status responses are the one Invity endpoint we mock.
    @step()
    async routeSwapWatch(status: string) {
        await this.page.route(invityEndpoint.swapWatch, async route => {
            await route.fulfill({ json: { status, sendAddress: this.liveTrade?.sendAddress } });
        });
    }

    // A stale in-flight poll can still carry the previous status, so keep advancing
    // the clock until a response with the target status is actually observed.
    @step()
    async advanceToWatchStatus(status: string) {
        await this.routeSwapWatch(status);

        for (let attempt = 0; attempt < 5; attempt++) {
            const watchResponsePromise = this.page
                .waitForResponse(invityEndpoint.swapWatch, { timeout: 35_000 })
                .catch(() => null);
            await this.page.clock.fastForward(this.watchPollPeriod);

            const response = await watchResponsePromise;
            if (response && (await response.json()).status === status) {
                return;
            }
        }

        throw new Error(`Watch response with status ${status} was not observed`);
    }

    validatePassphraseEnv = () => {
        if (!process.env.PASSPHRASE) {
            throw new Error(
                'PASSPHRASE not provided in env variables. Check suite/e2e/docs/e2e-playwright-suite.md.',
            );
        }
    };
}
